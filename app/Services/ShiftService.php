<?php

namespace App\Services;

use App\Exceptions\ShiftAlreadyOpenException;
use App\Models\CashRegisterShift;
use App\Models\SalePayment;
use App\Models\ShiftPayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * §7.5 del prompt maestro. Las ventas y sus pagos (Fase 4) todavía no se generan desde
 * ningún lado, pero la tabla ya existe (§7): mientras no haya ventas, efectivoEsperado es
 * simplemente el fondo de caja.
 */
class ShiftService
{
    public function getOpenShift(User $user): ?CashRegisterShift
    {
        return CashRegisterShift::query()
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();
    }

    /**
     * @throws ShiftAlreadyOpenException
     */
    public function open(User $user, int $openingAmountCents): CashRegisterShift
    {
        if ($this->getOpenShift($user)) {
            throw new ShiftAlreadyOpenException;
        }

        return CashRegisterShift::create([
            'user_id' => $user->id,
            'branch_id' => $user->branch_id,
            'opening_amount_cents' => $openingAmountCents,
            'opened_at' => now(),
            'status' => 'open',
        ]);
    }

    /**
     * efectivoEsperado = fondoDeCaja + Σ pagos en efectivo de las ventas completadas del turno.
     */
    public function expectedCash(CashRegisterShift $shift): int
    {
        return $shift->opening_amount_cents + $this->cashPaymentsTotal($shift);
    }

    public function close(CashRegisterShift $shift, int $actualCashCents): CashRegisterShift
    {
        return DB::transaction(function () use ($shift, $actualCashCents) {
            $expectedCashCents = $this->expectedCash($shift);

            foreach (['cash', 'card', 'transfer'] as $method) {
                $totals = SalePayment::query()
                    ->where('method', $method)
                    ->whereHas('sale', fn ($query) => $query
                        ->where('shift_id', $shift->id)
                        ->where('status', 'completed'))
                    ->selectRaw('COALESCE(SUM(amount_cents), 0) as total, COUNT(*) as cantidad')
                    ->first();

                ShiftPayment::updateOrCreate(
                    ['shift_id' => $shift->id, 'method' => $method],
                    [
                        'total_amount_cents' => (int) $totals->total,
                        'transaction_count' => (int) $totals->cantidad,
                    ],
                );
            }

            $shift->update([
                'expected_cash_cents' => $expectedCashCents,
                'actual_cash_cents' => $actualCashCents,
                'difference_cents' => $actualCashCents - $expectedCashCents,
                'closed_at' => now(),
                'status' => 'closed',
            ]);

            return $shift->fresh();
        });
    }

    private function cashPaymentsTotal(CashRegisterShift $shift): int
    {
        return (int) SalePayment::query()
            ->where('method', 'cash')
            ->whereHas('sale', fn ($query) => $query
                ->where('shift_id', $shift->id)
                ->where('status', 'completed'))
            ->sum('amount_cents');
    }
}
