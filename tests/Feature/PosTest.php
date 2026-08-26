<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegisterShift;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Branch}
     */
    private function cajeraConTurno(): array
    {
        $branch = Branch::factory()->create();
        $cajera = User::factory()->create(['branch_id' => $branch->id]);
        CashRegisterShift::factory()->for($cajera)->for($branch)->create();

        return [$cajera, $branch];
    }

    public function test_selling_three_products_discounts_stock_only_in_the_cajeras_branch(): void
    {
        [$cajera, $branch] = $this->cajeraConTurno();
        $otraSucursal = Branch::factory()->create();

        $p1 = Product::factory()->create(['sale_price_cents' => 1000, 'cost_price_cents' => 500]);
        $p2 = Product::factory()->create(['sale_price_cents' => 2000, 'cost_price_cents' => 1000]);
        $p3 = Product::factory()->create(['sale_price_cents' => 500, 'cost_price_cents' => 200]);

        foreach ([$p1, $p2, $p3] as $producto) {
            Inventory::create(['product_id' => $producto->id, 'branch_id' => $branch->id, 'stock' => 10]);
            Inventory::create(['product_id' => $producto->id, 'branch_id' => $otraSucursal->id, 'stock' => 10]);
        }

        $this->actingAs($cajera)->post('/caja', [
            'items' => [
                ['product_id' => $p1->id, 'quantity' => 2, 'discount_cents' => 0],
                ['product_id' => $p2->id, 'quantity' => 1, 'discount_cents' => 0],
                ['product_id' => $p3->id, 'quantity' => 3, 'discount_cents' => 0],
            ],
            'payments' => [['method' => 'cash', 'amount_cents' => 5500]],
        ])->assertSessionHasNoErrors();

        $this->assertSame(8, Inventory::where('product_id', $p1->id)->where('branch_id', $branch->id)->value('stock'));
        $this->assertSame(9, Inventory::where('product_id', $p2->id)->where('branch_id', $branch->id)->value('stock'));
        $this->assertSame(7, Inventory::where('product_id', $p3->id)->where('branch_id', $branch->id)->value('stock'));

        // La sucursal ajena no se toca.
        $this->assertSame(10, Inventory::where('product_id', $p1->id)->where('branch_id', $otraSucursal->id)->value('stock'));
    }

    public function test_mixed_payment_of_100_cash_and_50_card_for_130_total_records_both_and_shows_20_change(): void
    {
        [$cajera] = $this->cajeraConTurno();
        $product = Product::factory()->create([
            'sale_price_cents' => 13000,
            'cost_price_cents' => 5000,
            'manages_inventory' => false,
        ]);

        $response = $this->actingAs($cajera)->post('/caja', [
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'discount_cents' => 0]],
            'payments' => [
                ['method' => 'cash', 'amount_cents' => 10000],
                ['method' => 'card', 'amount_cents' => 5000],
            ],
        ]);

        $sale = Sale::firstOrFail();
        $response->assertRedirect(route('pos.success', $sale));

        $this->assertSame(13000, $sale->total_cents);
        $this->assertSame(2, $sale->payments()->count());
        $this->assertSame(13000, (int) $sale->payments()->sum('amount_cents'));

        $this->get(route('pos.success', $sale))
            ->assertInertia(fn ($page) => $page->where('changeCents', 2000));
    }

    public function test_insufficient_payment_shows_error_and_saves_nothing(): void
    {
        [$cajera] = $this->cajeraConTurno();
        $product = Product::factory()->create(['sale_price_cents' => 10000, 'manages_inventory' => false]);

        $this->actingAs($cajera)->post('/caja', [
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'discount_cents' => 0]],
            'payments' => [['method' => 'cash', 'amount_cents' => 5000]],
        ])->assertSessionHas('error', 'El pago es insuficiente.');

        $this->assertSame(0, Sale::count());
    }

    public function test_selling_the_last_unit_twice_fails_the_second_time_and_never_goes_negative(): void
    {
        [$cajera, $branch] = $this->cajeraConTurno();
        $product = Product::factory()->create(['sale_price_cents' => 1000]);
        Inventory::create(['product_id' => $product->id, 'branch_id' => $branch->id, 'stock' => 1]);

        $payload = [
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'discount_cents' => 0]],
            'payments' => [['method' => 'cash', 'amount_cents' => 1000]],
        ];

        $this->actingAs($cajera)->post('/caja', $payload)->assertSessionHasNoErrors();
        $this->assertSame(1, Sale::count());

        $this->actingAs($cajera)->post('/caja', $payload)
            ->assertSessionHas('error', "Sin existencia suficiente de {$product->name}.");

        $this->assertSame(1, Sale::count());
        $this->assertSame(0, Inventory::where('product_id', $product->id)->value('stock'));
    }

    public function test_two_consecutive_sales_get_consecutive_folios(): void
    {
        [$cajera] = $this->cajeraConTurno();
        $product = Product::factory()->create(['sale_price_cents' => 1000, 'manages_inventory' => false]);

        $payload = [
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'discount_cents' => 0]],
            'payments' => [['method' => 'cash', 'amount_cents' => 1000]],
        ];

        $this->actingAs($cajera)->post('/caja', $payload);
        $this->actingAs($cajera)->post('/caja', $payload);

        $folios = Sale::orderBy('id')->pluck('ticket_number')->all();

        $this->assertCount(2, $folios);
        $this->assertNotSame($folios[0], $folios[1]);

        $ultimoNumero = fn (string $folio) => (int) substr($folio, -4);
        $this->assertSame($ultimoNumero($folios[0]) + 1, $ultimoNumero($folios[1]));
    }

    public function test_the_public_ticket_and_its_pdf_download_both_work(): void
    {
        [$cajera] = $this->cajeraConTurno();
        $product = Product::factory()->create(['sale_price_cents' => 1000, 'manages_inventory' => false]);

        $this->actingAs($cajera)->post('/caja', [
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'discount_cents' => 0]],
            'payments' => [['method' => 'cash', 'amount_cents' => 1000]],
        ]);

        $sale = Sale::firstOrFail();

        // El token es público: cerrar sesión y aun así debe cargar.
        $this->post('/logout');

        $this->get("/ticket/{$sale->public_token}")->assertOk();

        $pdfResponse = $this->get("/ticket/{$sale->public_token}/pdf");
        $pdfResponse->assertOk();
        $pdfResponse->assertHeader('content-type', 'application/pdf');
    }
}
