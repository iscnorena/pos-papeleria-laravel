<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Solo esquema — ver el comentario en create_sales_table.php.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->string('product_name');
            $table->decimal('quantity', 12, 3);
            $table->bigInteger('unit_cost_cents');
            $table->bigInteger('unit_price_cents');
            $table->bigInteger('discount_cents')->default(0);
            $table->bigInteger('subtotal_cents');
            $table->bigInteger('profit_cents');
            $table->timestamps();

            $table->index('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
