<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 0; }
        body {
            margin: 0;
            padding: 8px 10px;
            font-family: "DejaVu Sans Mono", monospace;
            font-size: 10px;
            color: #17212F;
        }
        .centro { text-align: center; }
        .negocio { font-size: 13px; font-weight: bold; }
        .linea { border-top: 1px dashed #17212F; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 1px 0; vertical-align: top; }
        .derecha { text-align: right; }
        .total { font-size: 15px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="centro negocio">{{ config('pos.nombre_negocio') }}</div>
    <div class="centro">{{ $sale->branch->name }}</div>
    <div class="centro">{{ $sale->ticket_number }}</div>
    <div class="centro">{{ $sale->created_at->timezone(config('pos.timezone'))->format('d/m/Y H:i') }}</div>
    <div class="centro">Cajera: {{ $sale->user->name }}</div>

    <div class="linea"></div>

    <table>
        @foreach ($sale->items as $item)
            <tr>
                <td colspan="2">{{ $item->product_name }}</td>
            </tr>
            <tr>
                <td>{{ (int) $item->quantity }} x {{ \App\Support\Money::format($item->unit_price_cents) }}</td>
                <td class="derecha">{{ \App\Support\Money::format($item->subtotal_cents) }}</td>
            </tr>
        @endforeach
    </table>

    <div class="linea"></div>

    <table>
        <tr>
            <td>Subtotal</td>
            <td class="derecha">{{ \App\Support\Money::format($sale->subtotal_cents) }}</td>
        </tr>
        @if ($sale->tax_cents > 0)
            <tr>
                <td>Impuesto</td>
                <td class="derecha">{{ \App\Support\Money::format($sale->tax_cents) }}</td>
            </tr>
        @endif
        @if ($sale->discount_cents > 0)
            <tr>
                <td>Descuento</td>
                <td class="derecha">-{{ \App\Support\Money::format($sale->discount_cents) }}</td>
            </tr>
        @endif
        <tr class="total">
            <td>Total</td>
            <td class="derecha">{{ \App\Support\Money::format($sale->total_cents) }}</td>
        </tr>
    </table>

    <div class="linea"></div>

    <table>
        @foreach ($sale->payments as $payment)
            <tr>
                <td>{{ config("pos.metodos_pago.{$payment->method}") }}</td>
                <td class="derecha">{{ \App\Support\Money::format($payment->amount_cents) }}</td>
            </tr>
        @endforeach
    </table>

    @if (($cambioCents ?? 0) > 0)
        <table>
            <tr class="total">
                <td>Cambio</td>
                <td class="derecha">{{ \App\Support\Money::format($cambioCents) }}</td>
            </tr>
        </table>
        <div class="linea"></div>
    @else
        <div class="linea"></div>
    @endif

    <div class="centro">{{ config('pos.pie_ticket') }}</div>
</body>
</html>
