<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\InventoryService;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(private readonly InventoryService $inventoryService) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Products/Index', [
            'products' => Product::query()->with('category')->orderBy('name')->get(),
            'categories' => ProductCategory::query()->where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $product = Product::create([
            ...$data,
            'cost_price_cents' => Money::toCents($data['cost_price']),
            'sale_price_cents' => Money::toCents($data['sale_price']),
        ]);

        $this->inventoryService->provisionForAllBranches($product);

        return back()->with('success', 'Producto creado.');
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $manejabaInventario = $product->manages_inventory;

        $product->update([
            ...$data,
            'cost_price_cents' => Money::toCents($data['cost_price']),
            'sale_price_cents' => Money::toCents($data['sale_price']),
        ]);

        if (! $manejabaInventario && $product->manages_inventory) {
            $this->inventoryService->provisionForAllBranches($product);
        }

        return back()->with('success', 'Producto actualizado.');
    }
}
