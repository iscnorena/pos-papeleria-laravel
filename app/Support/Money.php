<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * §2 del prompt maestro: toda la aritmética de dinero se hace en centavos con enteros,
 * nunca con floats. La conversión ocurre en exactamente dos fronteras: al pintar en la
 * interfaz (toPesos/format) y al parsear un formulario (toCents).
 */
final class Money
{
    private function __construct() {}

    /**
     * "123.45" (o "123,45") -> 12345. Nunca pasa por un float.
     */
    public static function toCents(string $texto): int
    {
        $limpio = trim(str_replace(',', '', $texto));

        if ($limpio === '' || ! preg_match('/^-?\d+(\.\d{1,2})?$/', $limpio)) {
            throw new InvalidArgumentException("«{$texto}» no es un monto válido.");
        }

        $negativo = str_starts_with($limpio, '-');
        $limpio = ltrim($limpio, '-');

        [$enteros, $decimales] = array_pad(explode('.', $limpio, 2), 2, '0');
        $decimales = str_pad(substr($decimales, 0, 2), 2, '0');

        $centavos = ((int) $enteros) * 100 + (int) $decimales;

        return $negativo ? -$centavos : $centavos;
    }

    /**
     * 12345 -> "123.45". Sin símbolo ni separador de miles — para precargar un campo editable.
     */
    public static function toPesos(int $centavos): string
    {
        $negativo = $centavos < 0;
        $centavos = abs($centavos);

        $pesos = intdiv($centavos, 100);
        $resto = $centavos % 100;

        return ($negativo ? '-' : '').$pesos.'.'.str_pad((string) $resto, 2, '0', STR_PAD_LEFT);
    }

    /**
     * 12345 -> "$123.45". Con símbolo (§7.1) y separador de miles — para mostrarse tal cual.
     */
    public static function format(int $centavos): string
    {
        $simbolo = config('pos.simbolo_moneda', '$');
        $negativo = $centavos < 0;
        $centavos = abs($centavos);

        $pesos = intdiv($centavos, 100);
        $resto = $centavos % 100;

        return ($negativo ? '-' : '').$simbolo.number_format($pesos, 0, '', ',').'.'.
            str_pad((string) $resto, 2, '0', STR_PAD_LEFT);
    }
}
