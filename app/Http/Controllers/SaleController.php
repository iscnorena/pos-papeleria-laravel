<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use App\Services\SaleService;
use App\Support\Fechas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function __construct(private readonly SaleService $sales) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $esAdmin = $user->role === Role::Admin;

        $ventas = Sale::query()
            ->with(['user', 'branch'])
            ->when(! $esAdmin, fn ($query) => $query->where('user_id', $user->id))
            ->when(
                $esAdmin && $request->filled('branch_id'),
                fn ($query) => $query->where('branch_id', $request->integer('branch_id')),
            )
            ->when(
                $esAdmin && $request->filled('user_id'),
                fn ($query) => $query->where('user_id', $request->integer('user_id')),
            )
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->when(
                $request->filled('desde'),
                fn ($query) => $query->where(
                    'created_at',
                    '>=',
                    Fechas::inicioDelDiaUtc(Fechas::parse($request->string('desde')->value())),
                ),
            )
            ->when(
                $request->filled('hasta'),
                fn ($query) => $query->where(
                    'created_at',
                    '<=',
                    Fechas::finDelDiaUtc(Fechas::parse($request->string('hasta')->value())),
                ),
            )
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Sales/Index', [
            'sales' => $ventas,
            'branches' => $esAdmin ? Branch::query()->orderBy('name')->get() : [],
            'cashiers' => $esAdmin ? User::query()->orderBy('name')->get() : [],
            'filtros' => $request->only(['branch_id', 'user_id', 'status', 'desde', 'hasta']),
        ]);
    }

    public function show(Request $request, Sale $sale): Response
    {
        $user = $request->user();
        abort_unless($user->role === Role::Admin || $sale->user_id === $user->id, 403);

        return Inertia::render('Sales/Show', [
            'sale' => $sale->load(['items', 'payments', 'user', 'branch']),
        ]);
    }

    public function cancel(Sale $sale): RedirectResponse
    {
        $this->sales->cancelSale($sale);

        return back()->with('success', 'Venta cancelada.');
    }
}
