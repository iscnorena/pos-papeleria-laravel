const FORMATO = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
});

/** ISO en UTC (lo que manda Eloquent) -> "26/08, 09:00" en la zona horaria del navegador. */
export function formatearFechaHora(iso: string): string {
    return FORMATO.format(new Date(iso)).replace(' ', '');
}
