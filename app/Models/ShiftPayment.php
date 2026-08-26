<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['shift_id', 'method', 'total_amount_cents', 'transaction_count'])]
class ShiftPayment extends Model
{
    /**
     * @return BelongsTo<CashRegisterShift, $this>
     */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(CashRegisterShift::class, 'shift_id');
    }
}
