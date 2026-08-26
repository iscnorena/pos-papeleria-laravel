<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use App\Services\SaleService;
use App\Services\ShiftService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        private readonly ShiftService $shifts,
        private readonly SaleService $sales,
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $shift = $this->shifts->getOpenShift($user);

        if (! $shift) {
            return redirect()->route('turnos.abrir');
        }

        $products = Product::query()
            ->with(['category', 'inventories' => fn ($query) => $query->where('branch_id', $user->branch_id)])
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'category_id' => $product->category_id,
                'sale_price_cents' => $product->sale_price_cents,
                'manages_inventory' => $product->manages_inventory,
                'stock' => $product->manages_inventory
                    ? ($product->inventories->first()->stock ?? 0)
                    : null,
            ])
            ->values();

        return Inertia::render('Pos/Index', [
            'products' => $products,
            'categories' => ProductCategory::query()->where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $user = $request->user();
        $shift = $this->shifts->getOpenShift($user);

        abort_unless($shift, 403);

        $payments = $request->validated('payments');

        $sale = $this->sales->createSale(
            $user,
            $shift,
            $request->validated('items'),
            $payments,
            (int) ($request->validated('discount_cents') ?? 0),
        );

        $paidCents = array_sum(array_column($payments, 'amount_cents'));

        return redirect()
            ->route('pos.success', $sale)
            ->with('changeCents', $paidCents - $sale->total_cents);
    }

    public function success(Request $request, Sale $sale): Response
    {
        $user = $request->user();
        abort_unless($sale->user_id === $user->id || $user->role === Role::Admin, 403);

        return Inertia::render('Pos/Success', [
            'sale' => $sale->load(['items', 'payments']),
            'changeCents' => (int) $request->session()->get('changeCents', 0),
        ]);
    }
}
