<?php

namespace App\Services;

use App\Exceptions\InsufficientPaymentException;
use App\Exceptions\InsufficientStockException;
use App\Models\CashRegisterShift;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * §7.2–§7.4 del prompt maestro. Toda la venta (folio + venta + renglones + pagos +
 * inventario) vive en una sola transacción: o queda todo, o no queda nada. Los precios y
 * costos se leen siempre del producto en la base, nunca de lo que mande el cliente (§2).
 */
class SaleService
{
    public function __construct(private readonly FolioService $folios) {}

    /**
     * @param  array<int, array{product_id: int, quantity: int, discount_cents: int}>  $items
     * @param  array<int, array{method: string, amount_cents: int}>  $payments
     *
     * @throws InsufficientPaymentException
     * @throws InsufficientStockException
     */
    public function createSale(
        User $user,
        CashRegisterShift $shift,
        array $items,
        array $payments,
        int $generalDiscountCents,
    ): Sale {
        return DB::transaction(function () use ($user, $shift, $items, $payments, $generalDiscountCents) {
            $branchId = $user->branch_id;

            [$renglones, $subtotalCents, $totalCostCents] = $this->calcularRenglones($items);

            $tasaBps = (int) config('pos.tasa_impuesto');
            $taxCents = (int) round(($subtotalCents * $tasaBps) / 10000);
            $totalCents = max(0, $subtotalCents + $taxCents - $generalDiscountCents);
            $profitCents = $totalCents - $totalCostCents;

            $paidCents = array_sum(array_column($payments, 'amount_cents'));
            if ($paidCents < $totalCents - 1) {
                throw new InsufficientPaymentException;
            }

            $folio = $this->folios->next($branchId, config('pos.prefijo_ticket'), config('pos.timezone'));

            $sale = Sale::create([
                'ticket_number' => $folio,
                'public_token' => bin2hex(random_bytes(32)),
                'user_id' => $user->id,
                'branch_id' => $branchId,
                'shift_id' => $shift->id,
                'subtotal_cents' => $subtotalCents,
                'tax_cents' => $taxCents,
                'discount_cents' => $generalDiscountCents,
                'total_cents' => $totalCents,
                'total_cost_cents' => $totalCostCents,
                'profit_cents' => $profitCents,
                'status' => 'completed',
            ]);

            foreach ($renglones as $renglon) {
                $product = $renglon['product'];

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $renglon['quantity'],
                    'unit_cost_cents' => $product->cost_price_cents,
                    'unit_price_cents' => $product->sale_price_cents,
                    'discount_cents' => $renglon['discount_cents'],
                    'subtotal_cents' => $renglon['subtotal_cents'],
                    'profit_cents' => $renglon['profit_cents'],
                ]);

                if ($product->manages_inventory) {
                    $this->descontarInventario($product, $branchId, $renglon['quantity']);
                }
            }

            $this->registrarPagos($sale, $payments, $totalCents);

            return $sale->fresh(['items', 'payments']);
        });
    }

    /**
     * @param  array<int, array{product_id: int, quantity: int, discount_cents: int}>  $items
     * @return array{0: array<int, array{product: Product, quantity: int, discount_cents: int, subtotal_cents: int, profit_cents: int}>, 1: int, 2: int}
     */
    private function calcularRenglones(array $items): array
    {
        $renglones = [];
        $subtotalCents = 0;
        $totalCostCents = 0;

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $quantity = (int) $item['quantity'];
            $discountCents = (int) ($item['discount_cents'] ?? 0);

            $lineSubtotal = $product->sale_price_cents * $quantity - $discountCents;
            $lineCost = $product->cost_price_cents * $quantity;

            $subtotalCents += $lineSubtotal;
            $totalCostCents += $lineCost;

            $renglones[] = [
                'product' => $product,
                'quantity' => $quantity,
                'discount_cents' => $discountCents,
                'subtotal_cents' => $lineSubtotal,
                'profit_cents' => $lineSubtotal - $lineCost,
            ];
        }

        return [$renglones, $subtotalCents, $totalCostCents];
    }

    /**
     * @throws InsufficientStockException
     */
    private function descontarInventario(Product $product, int $branchId, int $quantity): void
    {
        $affected = DB::affectingStatement(
            'UPDATE inventories SET stock = stock - ?
             WHERE product_id = ? AND branch_id = ? AND stock >= ?',
            [$quantity, $product->id, $branchId, $quantity],
        );

        if ($affected === 0) {
            throw new InsufficientStockException($product->name);
        }
    }

    /**
     * @param  array<int, array{method: string, amount_cents: int}>  $payments
     */
    private function registrarPagos(Sale $sale, array $payments, int $totalCents): void
    {
        $restante = $totalCents;

        foreach ($payments as $payment) {
            if ($restante <= 0) {
                break;
            }

            $monto = min((int) $payment['amount_cents'], $restante);

            if ($monto <= 0) {
                continue;
            }

            SalePayment::create([
                'sale_id' => $sale->id,
                'method' => $payment['method'],
                'amount_cents' => $monto,
            ]);

            $restante -= $monto;
        }
    }
}
