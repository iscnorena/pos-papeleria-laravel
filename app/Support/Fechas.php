<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Date;

/**
 * §2 del prompt maestro: "ventas de hoy" es el día natural en la zona del negocio
 * (`config('pos.timezone')`), nunca `new Date()`/`now()` del servidor. Todo aquí regresa
 * límites en UTC, listos para usarse en un `whereBetween('created_at', ...)`.
 */
final class Fechas
{
    private function __construct() {}

    public static function hoy(): Carbon
    {
        return Date::now(config('pos.timezone'));
    }

    /**
     * Un "2026-08-25" que viene de un input de filtro es el día calendario del negocio, no un
     * instante UTC — hay que anclarlo a `pos.timezone` al parsear. `Carbon::parse('2026-08-25')`
     * a secas asume la zona horaria de la app (UTC aquí) y, con un negocio en UTC-6, ese
     * instante cae en el día ANTERIOR al reinterpretarlo en la zona del negocio.
     */
    public static function parse(string $fecha): Carbon
    {
        return Carbon::parse($fecha, config('pos.timezone'));
    }

    public static function inicioDelDiaUtc(?Carbon $fecha = null): Carbon
    {
        return ($fecha ?? self::hoy())->copy()->timezone(config('pos.timezone'))
            ->startOfDay()->utc();
    }

    public static function finDelDiaUtc(?Carbon $fecha = null): Carbon
    {
        return ($fecha ?? self::hoy())->copy()->timezone(config('pos.timezone'))
            ->endOfDay()->utc();
    }
}
