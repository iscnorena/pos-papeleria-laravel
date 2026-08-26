<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'pin_hash' => null,
            'role' => Role::Cajera,
            'branch_id' => Branch::factory(),
            'is_active' => true,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => Role::Admin,
        ]);
    }

    public function withPin(string $pin): static
    {
        return $this->state(fn (array $attributes) => [
            'pin_hash' => Hash::make($pin),
        ]);
    }
}
