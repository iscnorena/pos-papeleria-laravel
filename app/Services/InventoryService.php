<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Inventory;
use App\Models\Product;

class InventoryService
{
    /**
     * §8, Fase 2: al crear un producto con manages_inventory, se crea su fila de
     * inventories en todas las sucursales con stock 0.
     */
    public function provisionForAllBranches(Product $product): void
    {
        if (! $product->manages_inventory) {
            return;
        }

        Branch::query()->pluck('id')->each(function (int $branchId) use ($product) {
            Inventory::firstOrCreate([
                'product_id' => $product->id,
                'branch_id' => $branchId,
            ], [
                'stock' => 0,
            ]);
        });
    }

    /**
     * Ajuste manual de existencias (§8, Fase 2) — fija el nuevo valor, no es un delta.
     */
    public function adjustStock(Inventory $inventory, int $nuevoStock): void
    {
        $inventory->update(['stock' => $nuevoStock]);
    }
}
