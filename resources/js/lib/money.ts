/**
 * Contraparte de lectura de app/Support/Money.php (§2): el servidor manda enteros de
 * centavos por props de Inertia, y esto solo los pinta. El formulario nunca parsea dinero
 * en el cliente — manda el texto tal cual y el servidor lo convierte con Money::toCents().
 */
export function formatearPesos(centavos: number, simbolo = '$'): string {
    const negativo = centavos < 0;
    const absolutos = Math.abs(centavos);
    const pesos = Math.floor(absolutos / 100);
    const resto = absolutos % 100;

    return `${negativo ? '-' : ''}${simbolo}${pesos.toLocaleString('es-MX')}.${resto
        .toString()
        .padStart(2, '0')}`;
}

/** 12345 -> "123.45", para precargar un campo de texto editable (sin símbolo). */
export function centavosAPesos(centavos: number): string {
    const negativo = centavos < 0;
    const absolutos = Math.abs(centavos);
    const pesos = Math.floor(absolutos / 100);
    const resto = absolutos % 100;

    return `${negativo ? '-' : ''}${pesos}.${resto.toString().padStart(2, '0')}`;
}
