<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'code' => fake()->unique()->bothify('???-###'),
            'category_id' => null,
            'cost_price_cents' => 1000,
            'sale_price_cents' => 1600,
            'manages_inventory' => true,
            'is_active' => true,
        ];
    }
}
