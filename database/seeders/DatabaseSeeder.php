<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Semilla mínima de la Fase 1 (§8): una sucursal y un usuario admin para poder entrar.
 * La semilla completa de §9 (sucursales, cajeras, categorías, ~40 productos) llega en
 * fases posteriores, conforme esas tablas existan.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $principal = Branch::firstOrCreate(
            ['name' => 'Principal'],
            ['is_active' => true],
        );

        User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
                'pin_hash' => Hash::make('1234'),
                'role' => Role::Admin,
                'branch_id' => $principal->id,
                'is_active' => true,
            ],
        );
    }
}
