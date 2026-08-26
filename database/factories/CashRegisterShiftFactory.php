<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\CashRegisterShift;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CashRegisterShift>
 */
class CashRegisterShiftFactory extends Factory
{
    protected $model = CashRegisterShift::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'branch_id' => Branch::factory(),
            'opening_amount_cents' => 50000,
            'opened_at' => now(),
            'status' => 'open',
        ];
    }
}
