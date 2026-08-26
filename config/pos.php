<?php

return [
    'nombre_negocio' => env('POS_COMPANY_NAME', 'Mi Negocio'),
    'prefijo_ticket' => env('POS_TICKET_PREFIX', 'BR'),
    'tasa_impuesto' => (int) env('POS_TAX_RATE_BPS', 0), // basis points: 1600 = 16.00% (IVA)
    'simbolo_moneda' => env('POS_CURRENCY_SYMBOL', '$'),
    'codigo_moneda' => env('POS_CURRENCY_CODE', 'MXN'),
    'pie_ticket' => env('POS_TICKET_FOOTER', '¡Gracias por su compra!'),
    'ancho_ticket_mm' => (int) env('POS_TICKET_WIDTH_MM', 80),
    'timezone' => env('POS_TIMEZONE', 'America/Mexico_City'),
    'cobro_herramientas_enabled' => (bool) env('POS_COBRO_HERRAMIENTAS', false),
    'metodos_pago' => [
        'cash' => 'Efectivo',
        'card' => 'Tarjeta',
        'transfer' => 'Transferencia',
    ],
];
