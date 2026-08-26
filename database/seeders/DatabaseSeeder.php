<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Semilla de §9: dos sucursales, tres usuarios, siete categorías y un catálogo realista
 * de productos con margen 30-60%. Idempotente (firstOrCreate) — correrla varias veces no
 * duplica nada. Nada de ventas ni turnos: eso se genera usando el sistema.
 */
class DatabaseSeeder extends Seeder
{
    public function run(InventoryService $inventoryService): void
    {
        $principal = Branch::firstOrCreate(['name' => 'Principal'], ['is_active' => true]);
        $sucursal2 = Branch::firstOrCreate(['name' => 'Sucursal 2'], ['is_active' => true]);

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

        User::firstOrCreate(
            ['username' => 'cajera'],
            [
                'name' => 'Cajera',
                'password' => Hash::make('password'),
                'pin_hash' => Hash::make('5678'),
                'role' => Role::Cajera,
                'branch_id' => $principal->id,
                'is_active' => true,
            ],
        );

        User::firstOrCreate(
            ['username' => 'maria'],
            [
                'name' => 'María',
                'password' => Hash::make('password'),
                'pin_hash' => Hash::make('9012'),
                'role' => Role::Cajera,
                'branch_id' => $sucursal2->id,
                'is_active' => true,
            ],
        );

        $categorias = collect([
            'Cuadernos', 'Escritura', 'Papel', 'Escolar', 'Oficina', 'Arte', 'Impresión',
        ])->mapWithKeys(fn (string $nombre) => [
            $nombre => ProductCategory::firstOrCreate(['name' => $nombre], ['is_active' => true]),
        ]);

        // name, categoría, costo, precio (centavos) — margen entre 30% y 60%.
        $productos = [
            ['Cuaderno profesional 100h cuadro', 'Cuadernos', 2800, 4500],
            ['Cuaderno profesional 100h raya', 'Cuadernos', 2800, 4500],
            ['Cuaderno cosido 50h', 'Cuadernos', 1200, 2000],
            ['Libreta de taquigrafía', 'Cuadernos', 1500, 2400],
            ['Cuaderno argollado profesional', 'Cuadernos', 3500, 5500],
            ['Block de notas adhesivas 3x3', 'Cuadernos', 900, 1500],
            ['Lápiz del número 2', 'Escritura', 250, 500],
            ['Lápiz bicolor rojo/azul', 'Escritura', 400, 700],
            ['Bolígrafo tinta negra', 'Escritura', 300, 600],
            ['Bolígrafo tinta azul', 'Escritura', 300, 600],
            ['Marcador permanente negro', 'Escritura', 800, 1500],
            ['Marcador para pizarrón blanco', 'Escritura', 900, 1500],
            ['Resaltador amarillo', 'Escritura', 600, 1000],
            ['Set de 12 colores de madera', 'Escritura', 3500, 6000],
            ['Goma para borrar blanca', 'Escritura', 300, 500],
            ['Sacapuntas metálico', 'Escritura', 400, 700],
            ['Corrector líquido', 'Escritura', 700, 1200],
            ['Resma de papel bond carta', 'Papel', 9500, 14000],
            ['Resma de papel bond oficio', 'Papel', 11000, 16000],
            ['Paquete de cartulinas de colores', 'Papel', 3000, 5000],
            ['Papel crepé (paquete)', 'Papel', 2500, 4200],
            ['Sobres tamaño carta (paquete 10)', 'Papel', 1800, 3000],
            ['Hojas de colores tamaño carta', 'Papel', 2200, 3800],
            ['Mochila escolar', 'Escolar', 25000, 38000],
            ['Lonchera térmica', 'Escolar', 12000, 19000],
            ['Estuche escolar', 'Escolar', 4500, 7500],
            ['Regla de 30cm', 'Escolar', 700, 1200],
            ['Escuadra 45°', 'Escolar', 800, 1400],
            ['Transportador', 'Escolar', 600, 1000],
            ['Compás escolar', 'Escolar', 2500, 4200],
            ['Calculadora básica', 'Oficina', 6500, 10500],
            ['Engrapadora estándar', 'Oficina', 5500, 9000],
            ['Caja de clips', 'Oficina', 800, 1400],
            ['Caja de grapas', 'Oficina', 700, 1200],
            ['Cinta adhesiva transparente', 'Oficina', 900, 1500],
            ['Tijeras de oficina', 'Oficina', 1800, 3000],
            ['Folder tamaño carta (paquete 10)', 'Oficina', 3200, 5200],
            ['Pintura acrílica set 6 colores', 'Arte', 4500, 7500],
            ['Pinceles set surtido', 'Arte', 3000, 5000],
            ['Plastilina 12 colores', 'Arte', 2800, 4800],
            ['Cartulina para foamy (paquete)', 'Arte', 3500, 6000],
            ['Cartucho de tinta negra genérico', 'Impresión', 18000, 28000],
            ['Cartucho de tinta color genérico', 'Impresión', 20000, 31000],
            ['Papel fotográfico (paquete 20)', 'Impresión', 8500, 14000],
        ];

        foreach ($productos as [$nombre, $categoria, $costo, $precio]) {
            $producto = Product::firstOrCreate(
                ['name' => $nombre],
                [
                    'category_id' => $categorias[$categoria]->id,
                    'cost_price_cents' => $costo,
                    'sale_price_cents' => $precio,
                    'manages_inventory' => true,
                    'is_active' => true,
                ],
            );

            $inventoryService->provisionForAllBranches($producto);
        }
    }
}
