<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * §7.3 del prompt maestro. Debe llamarse dentro de la misma transacción que crea la venta
 * completa — el `lockForUpdate()` solo protege contra folios repetidos si ya hay una
 * transacción abierta alrededor.
 */
class FolioService
{
    public function next(int $branchId, string $prefix, string $timezone): string
    {
        $date = Carbon::now($timezone)->toDateString();

        DB::statement(
            'INSERT INTO folios (branch_id, date, last_number) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE last_number = last_number + 1',
            [$branchId, $date],
        );

        $lastNumber = DB::table('folios')
            ->where(['branch_id' => $branchId, 'date' => $date])
            ->lockForUpdate()
            ->value('last_number');

        $ymd = Carbon::now($timezone)->format('Ymd');

        return sprintf('%s%d-%s-%04d', $prefix, $branchId, $ymd, $lastNumber);
    }
}
