<?php

namespace App\Services;

use App\Models\Sale;
use App\Support\Fechas;
use Closure;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * §8 Fase 5. El volumen de este negocio es bajo (§0: "poco volumen"), así que agrupar en
 * PHP después de traer las ventas del rango es más simple y más claro que un GROUP BY con
 * conversión de zona horaria en SQL — y evita depender de que MySQL tenga cargadas las
 * tablas de zonas horarias con nombre (`America/Mexico_City`), que `CONVERT_TZ` necesitaría.
 */
class ReportService
{
    /**
     * @return array{filas: Collection<int, array<string, mixed>>, totales: array<string, mixed>, pagos: Collection<int, array<string, mixed>>}
     */
    public function porDia(Carbon $desde, Carbon $hasta): array
    {
        return $this->reporte($desde, $hasta, fn (Sale $s) => $s->created_at
            ->timezone(config('pos.timezone'))->toDateString());
    }

    /**
     * @return array{filas: Collection<int, array<string, mixed>>, totales: array<string, mixed>, pagos: Collection<int, array<string, mixed>>}
     */
    public function porSucursal(Carbon $desde, Carbon $hasta): array
    {
        return $this->reporte($desde, $hasta, fn (Sale $s) => $s->branch->name);
    }

    /**
     * @return array{filas: Collection<int, array<string, mixed>>, totales: array<string, mixed>, pagos: Collection<int, array<string, mixed>>}
     */
    public function porCajera(Carbon $desde, Carbon $hasta): array
    {
        return $this->reporte($desde, $hasta, fn (Sale $s) => $s->user->name);
    }

    /**
     * @return array{filas: Collection<int, array<string, mixed>>, totales: array<string, mixed>, pagos: Collection<int, array<string, mixed>>}
     */
    private function reporte(Carbon $desde, Carbon $hasta, Closure $etiqueta): array
    {
        $ventas = Sale::query()
            ->where('status', 'completed')
            ->whereBetween('created_at', [Fechas::inicioDelDiaUtc($desde), Fechas::finDelDiaUtc($hasta)])
            ->with(['branch', 'user', 'payments'])
            ->get();

        $filas = $ventas
            ->groupBy($etiqueta)
            ->map(fn (Collection $grupo, string $clave) => [
                'etiqueta' => $clave,
                'ventas' => $grupo->count(),
                'ingresoCents' => (int) $grupo->sum('total_cents'),
                'costoCents' => (int) $grupo->sum('total_cost_cents'),
                'gananciaCents' => (int) $grupo->sum('profit_cents'),
            ])
            ->sortKeys()
            ->values();

        $pagos = $ventas
            ->flatMap(fn (Sale $venta) => $venta->payments)
            ->groupBy('method')
            ->map(fn (Collection $grupo, string $metodo) => [
                'method' => $metodo,
                'totalCents' => (int) $grupo->sum('amount_cents'),
            ])
            ->values();

        return [
            'filas' => $filas,
            'totales' => [
                'ventas' => $ventas->count(),
                'ingresoCents' => (int) $ventas->sum('total_cents'),
                'costoCents' => (int) $ventas->sum('total_cost_cents'),
                'gananciaCents' => (int) $ventas->sum('profit_cents'),
            ],
            'pagos' => $pagos,
        ];
    }
}
