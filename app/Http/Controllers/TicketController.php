<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class TicketController extends Controller
{
    public function show(Request $request, string $token): InertiaResponse
    {
        $sale = Sale::query()
            ->where('public_token', $token)
            ->with(['items', 'payments', 'branch', 'user'])
            ->firstOrFail();

        return Inertia::render('Ticket/Show', [
            'sale' => $sale,
            // El cambio no se guarda (§7.2): solo viaja aquí si viene de la pantalla de
            // éxito recién cobrada. Un ticket abierto después (WhatsApp, etc.) no lo trae.
            'cambioCents' => $request->integer('cambio_cents'),
            // Formateado en el servidor, en la zona horaria del negocio: quien abra el
            // link compartido puede estar en cualquier zona horaria de su teléfono.
            'creadoEn' => $sale->created_at->timezone(config('pos.timezone'))->translatedFormat('d/m/Y H:i'),
            'pieTicket' => config('pos.pie_ticket'),
        ]);
    }

    public function pdf(Request $request, string $token): Response
    {
        $sale = Sale::query()
            ->where('public_token', $token)
            ->with(['items', 'payments', 'branch', 'user'])
            ->firstOrFail();

        $anchoMm = config('pos.ancho_ticket_mm');
        $anchoPuntos = $anchoMm * 2.8346; // 1mm = 2.8346pt

        $pdf = Pdf::loadView('tickets.pdf', [
            'sale' => $sale,
            'cambioCents' => $request->integer('cambio_cents'),
        ])->setPaper([0, 0, $anchoPuntos, 1000]);

        return $pdf->stream("{$sale->ticket_number}.pdf");
    }
}
