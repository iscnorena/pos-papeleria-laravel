<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Solo el esquema (§7): la fórmula de cierre de turno (§7.5) necesita sumar los pagos en
 * efectivo de las ventas completadas del turno, así que la tabla debe existir desde la
 * Fase 3 aunque todavía no haya nada que la llene — eso es trabajo de la Fase 4
 * (SaleService, folios, el punto de venta). Ninguna ruta ni controlador de ventas se
 * construye aquí.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();
            $table->string('public_token', 64)->unique();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('shift_id')->constrained('cash_register_shifts');
            $table->bigInteger('subtotal_cents');
            $table->bigInteger('tax_cents')->default(0);
            $table->bigInteger('discount_cents')->default(0);
            $table->bigInteger('total_cents');
            $table->bigInteger('total_cost_cents');
            $table->bigInteger('profit_cents');
            $table->enum('status', ['completed', 'cancelled'])->default('completed');
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'created_at']);
            $table->index('shift_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
