import Boton from '@/Components/ui/Boton';
import { formatearPesos } from '@/lib/money';
import { MetodoPago, PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

interface SaleItemRow {
    id: number;
    product_name: string;
    quantity: string;
    unit_price_cents: number;
    subtotal_cents: number;
}

interface SalePaymentRow {
    id: number;
    method: MetodoPago;
    amount_cents: number;
}

interface TicketSale {
    ticket_number: string;
    public_token: string;
    subtotal_cents: number;
    tax_cents: number;
    discount_cents: number;
    total_cents: number;
    branch: { name: string };
    user: { name: string };
    items: SaleItemRow[];
    payments: SalePaymentRow[];
}

export default function Show({
    sale,
    cambioCents,
    creadoEn,
    pieTicket,
}: {
    sale: TicketSale;
    cambioCents: number;
    creadoEn: string;
    pieTicket: string;
}) {
    const { pos } = usePage<PageProps>().props;

    return (
        <div className="flex min-h-screen justify-center bg-papel-hondo py-8 print:bg-white print:py-0">
            <Head title={`Ticket ${sale.ticket_number}`} />
            <style>{`
                @media print {
                    @page { size: 80mm auto; margin: 0; }
                    .no-imprimir { display: none !important; }
                }
            `}</style>

            <div className="w-cinta bg-white p-5 font-mono text-fino text-tinta shadow-cinta print:shadow-none">
                <div className="text-center">
                    <div className="font-display text-cuerpo font-bold">{pos.nombreNegocio}</div>
                    <div>{sale.branch.name}</div>
                    <div>{sale.ticket_number}</div>
                    <div>{creadoEn}</div>
                    <div>Cajera: {sale.user.name}</div>
                </div>

                <div className="my-3 border-t border-dashed border-tinta" />

                {sale.items.map((item) => (
                    <div key={item.id} className="mb-1.5">
                        <div>{item.product_name}</div>
                        <div className="flex justify-between">
                            <span>
                                {parseInt(item.quantity, 10)} x{' '}
                                {formatearPesos(item.unit_price_cents)}
                            </span>
                            <span>{formatearPesos(item.subtotal_cents)}</span>
                        </div>
                    </div>
                ))}

                <div className="my-3 border-t border-dashed border-tinta" />

                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatearPesos(sale.subtotal_cents)}</span>
                </div>
                {sale.tax_cents > 0 && (
                    <div className="flex justify-between">
                        <span>Impuesto</span>
                        <span>{formatearPesos(sale.tax_cents)}</span>
                    </div>
                )}
                {sale.discount_cents > 0 && (
                    <div className="flex justify-between">
                        <span>Descuento</span>
                        <span>-{formatearPesos(sale.discount_cents)}</span>
                    </div>
                )}
                <div className="flex justify-between text-cuerpo font-bold">
                    <span>Total</span>
                    <span>{formatearPesos(sale.total_cents)}</span>
                </div>

                <div className="my-3 border-t border-dashed border-tinta" />

                {sale.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between">
                        <span>{pos.metodosPago[payment.method]}</span>
                        <span>{formatearPesos(payment.amount_cents)}</span>
                    </div>
                ))}
                {cambioCents > 0 && (
                    <div className="flex justify-between font-bold">
                        <span>Cambio</span>
                        <span>{formatearPesos(cambioCents)}</span>
                    </div>
                )}

                <div className="my-3 border-t border-dashed border-tinta" />

                <div className="text-center">{pieTicket}</div>

                <div className="no-imprimir mt-5 flex gap-2">
                    <Boton variante="secundaria" className="flex-1" onClick={() => window.print()}>
                        Imprimir
                    </Boton>
                    <a
                        href={route('ticket.pdf', {
                            token: sale.public_token,
                            cambio_cents: cambioCents,
                        })}
                        className="flex-1"
                    >
                        <Boton className="w-full">Descargar PDF</Boton>
                    </a>
                </div>
            </div>
        </div>
    );
}
