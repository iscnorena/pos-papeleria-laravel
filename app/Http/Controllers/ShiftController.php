<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Requests\CloseShiftRequest;
use App\Http\Requests\OpenShiftRequest;
use App\Models\CashRegisterShift;
use App\Services\ShiftService;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function __construct(private readonly ShiftService $shifts) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $esAdmin = $user->role === Role::Admin;

        $openShift = $esAdmin
            ? CashRegisterShift::query()->with(['user', 'branch'])->where('status', 'open')->first()
            : $this->shifts->getOpenShift($user)?->load('branch');

        $closedShifts = CashRegisterShift::query()
            ->with(['user', 'branch'])
            ->when(! $esAdmin, fn ($query) => $query->where('user_id', $user->id))
            ->where('status', 'closed')
            ->orderByDesc('closed_at')
            ->get();

        return Inertia::render('Shifts/Index', [
            'openShift' => $openShift,
            'closedShifts' => $closedShifts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Shifts/Open');
    }

    public function store(OpenShiftRequest $request): RedirectResponse
    {
        $shift = $this->shifts->open(
            $request->user(),
            Money::toCents($request->validated('opening_amount')),
        );

        return redirect()->route('turnos.show', $shift)->with('success', 'Turno abierto.');
    }

    public function show(Request $request, CashRegisterShift $shift): Response
    {
        $this->autorizarAcceso($request, $shift);

        return Inertia::render('Shifts/Show', [
            'shift' => $shift->load(['user', 'branch', 'payments', 'sales']),
        ]);
    }

    public function edit(Request $request, CashRegisterShift $shift): Response|RedirectResponse
    {
        $this->autorizarCierre($request, $shift);

        return Inertia::render('Shifts/Close', [
            'shift' => $shift,
            'expectedCashCents' => $this->shifts->expectedCash($shift),
        ]);
    }

    public function update(CloseShiftRequest $request, CashRegisterShift $shift): RedirectResponse
    {
        $this->autorizarCierre($request, $shift);

        $this->shifts->close($shift, Money::toCents($request->validated('actual_cash')));

        return redirect()->route('turnos.show', $shift)->with('success', 'Turno cerrado.');
    }

    private function autorizarAcceso(Request $request, CashRegisterShift $shift): void
    {
        $user = $request->user();

        abort_unless($user->role === Role::Admin || $shift->user_id === $user->id, 403);
    }

    private function autorizarCierre(Request $request, CashRegisterShift $shift): void
    {
        $user = $request->user();

        abort_unless($shift->user_id === $user->id, 403);
        abort_if($shift->status !== 'open', 403);
    }
}
