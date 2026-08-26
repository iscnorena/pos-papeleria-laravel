import Boton from '@/Components/ui/Boton';
import Distintivo from '@/Components/ui/Distintivo';
import Modal from '@/Components/ui/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatearFechaHora } from '@/lib/fecha';
import { formatearPesos } from '@/lib/money';
import { MetodoPago, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

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

interface SaleDetail {
    id: number;
    ticket_number: string;
    public_token: string;
    status: 'completed' | 'cancelled';
    subtotal_cents: number;
    tax_cents: number;
    discount_cents: number;
    total_cents: number;
    profit_cents: number;
    created_at: string;
    user: { id: number; name: string };
    branch: { id: number; name: string };
    items: SaleItemRow[];
    payments: SalePaymentRow[];
}

export default function Show({ sale }: { sale: SaleDetail }) {
    const { auth, pos } = usePage<PageProps>().props;
    const [confirmando, setConfirmando] = useState(false);
    const esAdmin = auth.user?.role === 'admin';
    const cancelada = sale.status === 'cancelled';

    const cancelar = () => {
        router.put(
            route('ventas.cancelar', sale.id),
            {},
            { onSuccess: () => setConfirmando(false) },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Venta ${sale.ticket_number}`} />

            <div className="mx-auto flex max-w-2xl flex-col gap-5 p-8">
                <div>
                    <Distintivo tono={cancelada ? 'sello' : 'visto'}>
                        {cancelada ? 'Cancelada' : 'Completada'}
                    </Distintivo>
                    <div className="mt-2 flex items-center justify-between">
                        <h1 className="font-display text-titulo font-bold text-tinta">
                            {sale.ticket_number}
                        </h1>
                        <div className="flex gap-2">
                            <a
                                href={route('ticket.show', sale.public_token)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Boton variante="secundaria">Ver ticket</Boton>
                            </a>
                            {esAdmin && !cancelada && (
                                <Boton variante="destructiva" onClick={() => setConfirmando(true)}>
                                    Cancelar venta
                                </Boton>
                            )}
                        </div>
                    </div>
                    <div className="mt-1 font-mono text-fino text-grafito">
                        {formatearFechaHora(sale.created_at)} · {sale.user.name} ·{' '}
                        {sale.branch.name}
                    </div>
                </div>

                <table className="w-full border-collapse border border-linea-fuerte bg-white">
                    <thead>
                        <tr className="border-b border-linea-fuerte">
                            <th className="p-2 text-left font-mono text-micro uppercase text-grafito">
                                Producto
                            </th>
                            <th className="p-2 text-right font-mono text-micro uppercase text-grafito">
                                Cant.
                            </th>
                            <th className="p-2 text-right font-mono text-micro uppercase text-grafito">
                                Precio
                            </th>
                            <th className="p-2 text-right font-mono text-micro uppercase text-grafito">
                                Subtotal
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item) => (
                            <tr key={item.id} className="border-b border-linea last:border-0">
                                <td className="p-2 text-base text-tinta">{item.product_name}</td>
                                <td className="p-2 text-right font-mono text-base text-tinta">
                                    {parseInt(item.quantity, 10)}
                                </td>
                                <td className="p-2 text-right font-mono text-base text-tinta">
                                    {formatearPesos(item.unit_price_cents)}
                                </td>
                                <td className="p-2 text-right font-mono text-base text-tinta">
                                    {formatearPesos(item.subtotal_cents)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex gap-5">
                    <div className="flex-1 border border-linea-fuerte bg-white p-4">
                        <div className="flex justify-between py-0.5">
                            <span className="font-mono text-micro uppercase text-grafito">
                                Subtotal
                            </span>
                            <span className="font-mono text-base text-tinta">
                                {formatearPesos(sale.subtotal_cents)}
                            </span>
                        </div>
                        {sale.tax_cents > 0 && (
                            <div className="flex justify-between py-0.5">
                                <span className="font-mono text-micro uppercase text-grafito">
                                    Impuesto
                                </span>
                                <span className="font-mono text-base text-tinta">
                                    {formatearPesos(sale.tax_cents)}
                                </span>
                            </div>
                        )}
                        {sale.discount_cents > 0 && (
                            <div className="flex justify-between py-0.5">
                                <span className="font-mono text-micro uppercase text-grafito">
                                    Descuento
                                </span>
                                <span className="font-mono text-base text-tinta">
                                    -{formatearPesos(sale.discount_cents)}
                                </span>
                            </div>
                        )}
                        <div className="mt-1 flex justify-between border-t border-linea pt-1">
                            <span className="font-mono text-micro uppercase text-grafito">
                                Total
                            </span>
                            <span className="font-mono text-base font-bold text-tinta">
                                {formatearPesos(sale.total_cents)}
                            </span>
                        </div>
                        {esAdmin && (
                            <div className="mt-1 flex justify-between">
                                <span className="font-mono text-micro uppercase text-grafito">
                                    Ganancia
                                </span>
                                <span className="font-mono text-base text-visto">
                                    {formatearPesos(sale.profit_cents)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 border border-linea-fuerte bg-white p-4">
                        <div className="mb-2 font-mono text-micro uppercase text-grafito">
                            Pagos
                        </div>
                        {sale.payments.map((payment) => (
                            <div key={payment.id} className="flex justify-between py-0.5">
                                <span className="text-base text-tinta">
                                    {pos.metodosPago[payment.method]}
                                </span>
                                <span className="font-mono text-base text-tinta">
                                    {formatearPesos(payment.amount_cents)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal
                abierto={confirmando}
                onCerrar={() => setConfirmando(false)}
                titulo="¿Cancelar esta venta?"
            >
                <p className="text-base text-tinta">
                    Se devolverá el inventario de los productos que manejan existencia. La venta
                    seguirá visible en el historial, marcada como cancelada. Esta acción no se puede
                    deshacer.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                    <Boton variante="secundaria" onClick={() => setConfirmando(false)}>
                        Volver
                    </Boton>
                    <Boton variante="destructiva" onClick={cancelar}>
                        Cancelar venta
                    </Boton>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
