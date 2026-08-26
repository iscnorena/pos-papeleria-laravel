<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('cash_register_shifts')->cascadeOnDelete();
            $table->enum('method', ['cash', 'card', 'transfer']);
            $table->bigInteger('total_amount_cents')->default(0);
            $table->unsignedInteger('transaction_count')->default(0);
            $table->timestamps();

            $table->unique(['shift_id', 'method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_payments');
    }
};
