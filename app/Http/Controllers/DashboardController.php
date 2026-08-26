<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\Inventory;
use App\Models\Sale;
use App\Services\ShiftService;
use App\Support\Fechas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly ShiftService $shifts) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $esAdmin = $user->role === Role::Admin;

        $ventasHoy = Sale::query()
            ->where('status', 'completed')
            ->whereBetween('created_at', [Fechas::inicioDelDiaUtc(), Fechas::finDelDiaUtc()])
            ->when(! $esAdmin, fn ($query) => $query->where('user_id', $user->id));

        $productosStockBajo = Inventory::query()
            ->where('branch_id', $user->branch_id)
            ->where('stock', '<=', 0)
            ->whereHas('product', fn ($query) => $query
                ->where('manages_inventory', true)
                ->where('is_active', true))
            ->count();

        return Inertia::render('Dashboard', [
            'ventasHoy' => (clone $ventasHoy)->count(),
            'ingresoHoyCents' => (int) (clone $ventasHoy)->sum('total_cents'),
            'gananciaHoyCents' => (int) (clone $ventasHoy)->sum('profit_cents'),
            'turnoAbierto' => $this->shifts->getOpenShift($user),
            'productosStockBajo' => $productosStockBajo,
        ]);
    }
}
