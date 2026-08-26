<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use App\Support\Fechas;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reports) {}

    public function daily(Request $request): Response
    {
        [$desde, $hasta] = $this->rango($request);

        return $this->render('diario', 'Día', $desde, $hasta, $this->reports->porDia($desde, $hasta));
    }

    public function byBranch(Request $request): Response
    {
        [$desde, $hasta] = $this->rango($request);

        return $this->render(
            'sucursales',
            'Sucursal',
            $desde,
            $hasta,
            $this->reports->porSucursal($desde, $hasta),
        );
    }

    public function byCashier(Request $request): Response
    {
        [$desde, $hasta] = $this->rango($request);

        return $this->render(
            'cajeras',
            'Cajera',
            $desde,
            $hasta,
            $this->reports->porCajera($desde, $hasta),
        );
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function rango(Request $request): array
    {
        $hoy = Fechas::hoy();

        $desde = $request->filled('desde') ? Fechas::parse($request->string('desde')->value()) : $hoy->copy();
        $hasta = $request->filled('hasta') ? Fechas::parse($request->string('hasta')->value()) : $hoy->copy();

        return [$desde, $hasta];
    }

    /**
     * @param  array{filas: mixed, totales: mixed, pagos: mixed}  $datos
     */
    private function render(string $tipo, string $columna, Carbon $desde, Carbon $hasta, array $datos): Response
    {
        return Inertia::render('Reports/Index', [
            'tipo' => $tipo,
            'columnaEtiqueta' => $columna,
            'desde' => $desde->toDateString(),
            'hasta' => $hasta->toDateString(),
            ...$datos,
        ]);
    }
}
