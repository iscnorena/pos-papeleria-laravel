<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Solo el modelo mínimo para que §7.5 (cierre de turno) pueda sumar pagos. La lógica de
 * negocio de ventas (SaleService, folios, cálculo §7.2) es de la Fase 4.
 */
#[Fillable([
    'ticket_number', 'public_token', 'user_id', 'branch_id', 'shift_id',
    'subtotal_cents', 'tax_cents', 'discount_cents', 'total_cents',
    'total_cost_cents', 'profit_cents', 'status', 'notes',
])]
class Sale extends Model
{
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * @return BelongsTo<CashRegisterShift, $this>
     */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(CashRegisterShift::class, 'shift_id');
    }

    /**
     * @return HasMany<SaleItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * @return HasMany<SalePayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }
}
