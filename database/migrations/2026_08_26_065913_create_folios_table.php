<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sin `id` ni timestamps a propósito (§7.3): el contador vive por (branch_id, date) y se
 * incrementa con un `INSERT ... ON DUPLICATE KEY UPDATE` atómico — se maneja con
 * `DB::table('folios')`, nunca un modelo Eloquent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('folios', function (Blueprint $table) {
            $table->foreignId('branch_id')->constrained();
            $table->date('date');
            $table->unsignedInteger('last_number')->default(0);

            $table->primary(['branch_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('folios');
    }
};
