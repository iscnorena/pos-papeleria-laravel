<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InventoryAdjustRequest;
use App\Models\Branch;
use App\Models\Inventory;
use App\Models\ProductCategory;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(private readonly InventoryService $inventoryService) {}

    public function index(Request $request): Response
    {
        $inventories = Inventory::query()
            ->with(['product.category', 'branch'])
            ->when($request->string('branch_id')->isNotEmpty(), fn ($query) => $query->where(
                'branch_id',
                $request->integer('branch_id'),
            ))
            ->when($request->string('category_id')->isNotEmpty(), fn ($query) => $query->whereHas(
                'product',
                fn ($productQuery) => $productQuery->where('category_id', $request->integer('category_id')),
            ))
            ->when($request->string('buscar')->isNotEmpty(), function ($query) use ($request) {
                $termino = '%'.$request->string('buscar').'%';
                $query->whereHas('product', fn ($productQuery) => $productQuery
                    ->where('name', 'like', $termino)
                    ->orWhere('code', 'like', $termino));
            })
            ->whereHas('product', fn ($query) => $query->where('manages_inventory', true))
            ->join('products', 'products.id', '=', 'inventories.product_id')
            ->orderBy('products.name')
            ->select('inventories.*')
            ->get();

        return Inertia::render('Admin/Inventory/Index', [
            'inventories' => $inventories,
            'branches' => Branch::query()->where('is_active', true)->orderBy('name')->get(),
            'categories' => ProductCategory::query()->where('is_active', true)->orderBy('name')->get(),
            'filtros' => $request->only(['branch_id', 'category_id', 'buscar']),
        ]);
    }

    public function update(InventoryAdjustRequest $request, Inventory $inventory): RedirectResponse
    {
        $this->inventoryService->adjustStock($inventory, $request->validated('stock'));

        return back()->with('success', 'Existencia actualizada.');
    }
}
