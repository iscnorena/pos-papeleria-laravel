import Boton from '@/Components/ui/Boton';
import Distintivo from '@/Components/ui/Distintivo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatearFechaHora } from '@/lib/fecha';
import { formatearPesos } from '@/lib/money';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

type Metodo = 'cash' | 'card' | 'transfer';

const ETIQUETAS_METODO: Record<Metodo, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
};

interface ShiftPaymentRow {
    method: Metodo;
    total_amount_cents: number;
    transaction_count: number;
}

interface SaleRow {
    id: number;
    ticket_number: string;
    status: 'completed' | 'cancelled';
    total_cents: number;
    profit_cents: number;
}

interface ShiftDetail {
    id: number;
    status: 'open' | 'closed';
    opening_amount_cents: number;
    expected_cash_cents: number | null;
    actual_cash_cents: number | null;
    difference_cents: number | null;
    opened_at: string;
    closed_at: string | null;
    user: { id: number; name: string };
    branch: { id: number; name: string };
    payments: ShiftPaymentRow[];
    sales: SaleRow[];
}

export default function Show({ shift }: { shift: ShiftDetail }) {
    const { auth } = usePage<PageProps>().props;

    const ventasCompletadas = shift.sales.filter((s) => s.status === 'completed');
    const ventasCanceladas = shift.sales.filter((s) => s.status === 'cancelled');
    const ingreso = ventasCompletadas.reduce((suma, s) => suma + s.total_cents, 0);
    const ganancia = ventasCompletadas.reduce((suma, s) => suma + s.profit_cents, 0);

    const diferenciaTono =
        shift.difference_cents === null || shift.difference_cents === 0
            ? 'visto'
            : shift.difference_cents < 0
              ? 'sello'
              : 'grafito';

    const esMiTurno = auth.user?.id === shift.user.id;

    return (
        <AuthenticatedLayout>
            <Head title={`Turno de ${shift.user.name}`} />

            <div className="mx-auto flex max-w-3xl flex-col gap-5 p-8">
                <div>
                    <Distintivo tono={shift.status === 'open' ? 'visto' : 'grafito'}>
                        {shift.status === 'open' ? 'Abierto' : 'Cerrado'}
                    </Distintivo>
                    <div className="mt-2 flex items-center justify-between">
                        <h1 className="font-display text-titulo font-bold text-tinta">
                            Turno de {shift.user.name} · {shift.branch.name}
                        </h1>
                        {shift.status === 'open' && esMiTurno && (
                            <Link href={route('turnos.cerrar', shift.id)}>
                                <Boton variante="destructiva">Cerrar turno</Boton>
                            </Link>
                        )}
                    </div>
                    <div className="mt-1 font-mono text-fino text-grafito">
                        Abierto {formatearFechaHora(shift.opened_at)}
                        {shift.closed_at && <> · Cerrado {formatearFechaHora(shift.closed_at)}</>}
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    {[
                        ['Ventas', String(ventasCompletadas.length)],
                        ['Ingreso', formatearPesos(ingreso)],
                        ['Ganancia', formatearPesos(ganancia)],
                        ['Canceladas', String(ventasCanceladas.length)],
                    ].map(([etiqueta, valor]) => (
                        <div key={etiqueta} className="border border-linea-fuerte bg-white p-4">
                            <div className="font-mono text-micro uppercase text-grafito">
                                {etiqueta}
                            </div>
                            <div className="mt-1 font-display text-cifra font-bold text-tinta">
                                {valor}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2 border border-linea-fuerte bg-white p-5">
                        {[
                            ['Fondo', formatearPesos(shift.opening_amount_cents)],
                            [
                                'Esperado',
                                shift.expected_cash_cents !== null
                                    ? formatearPesos(shift.expected_cash_cents)
                                    : '—',
                            ],
                            [
                                'Contado',
                                shift.actual_cash_cents !== null
                                    ? formatearPesos(shift.actual_cash_cents)
                                    : '—',
                            ],
                        ].map(([etiqueta, valor]) => (
                            <div key={etiqueta} className="flex justify-between">
                                <span className="font-mono text-micro uppercase text-grafito">
                                    {etiqueta}
                                </span>
                                <span className="font-mono text-base text-tinta">{valor}</span>
                            </div>
                        ))}
                        {shift.difference_cents !== null && (
                            <div className="flex justify-between border-t border-linea pt-2">
                                <span
                                    className={`font-mono text-micro uppercase ${diferenciaTono === 'sello' ? 'text-sello' : diferenciaTono === 'visto' ? 'text-visto' : 'text-grafito'}`}
                                >
                                    Diferencia
                                </span>
                                <span
                                    className={`font-mono text-base font-semibold ${diferenciaTono === 'sello' ? 'text-sello' : diferenciaTono === 'visto' ? 'text-visto' : 'text-grafito'}`}
                                >
                                    {formatearPesos(shift.difference_cents)}
                                </span>
                            </div>
                        )}
                    </div>

                    <table className="h-fit w-full border-collapse border border-linea-fuerte bg-white">
                        <thead>
                            <tr className="border-b border-linea-fuerte">
                                <th className="p-2 text-left font-mono text-micro uppercase text-grafito">
                                    Método
                                </th>
                                <th className="p-2 text-right font-mono text-micro uppercase text-grafito">
                                    Total
                                </th>
                                <th className="p-2 text-right font-mono text-micro uppercase text-grafito">
                                    Tx
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(['cash', 'card', 'transfer'] as Metodo[]).map((metodo) => {
                                const pago = shift.payments.find((p) => p.method === metodo);
                                return (
                                    <tr
                                        key={metodo}
                                        className="border-b border-linea last:border-0"
                                    >
                                        <td className="p-2 text-base text-tinta">
                                            {ETIQUETAS_METODO[metodo]}
                                        </td>
                                        <td className="p-2 text-right font-mono text-base text-tinta">
                                            {formatearPesos(pago?.total_amount_cents ?? 0)}
                                        </td>
                                        <td className="p-2 text-right font-mono text-base text-tinta">
                                            {pago?.transaction_count ?? 0}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div>
                    <h2 className="mb-2 font-mono text-micro uppercase text-grafito">
                        Ventas del turno
                    </h2>
                    {shift.sales.length === 0 ? (
                        <div className="border border-linea-fuerte bg-white p-8 text-center font-mono text-fino text-grafito">
                            Aún no hay ventas en este turno.
                        </div>
                    ) : (
                        <table className="w-full border-collapse border border-linea-fuerte bg-white">
                            <thead>
                                <tr className="border-b border-linea-fuerte">
                                    <th className="p-2 text-left font-mono text-micro uppercase text-grafito">
                                        Folio
                                    </th>
                                    <th className="p-2 text-right font-mono text-micro uppercase text-grafito">
                                        Total
                                    </th>
                                    <th className="p-2 text-left font-mono text-micro uppercase text-grafito">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {shift.sales.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className="border-b border-linea last:border-0"
                                    >
                                        <td className="p-2 font-mono text-base text-tinta">
                                            {sale.ticket_number}
                                        </td>
                                        <td className="p-2 text-right font-mono text-base text-tinta">
                                            {formatearPesos(sale.total_cents)}
                                        </td>
                                        <td className="p-2">
                                            <Distintivo
                                                tono={
                                                    sale.status === 'completed' ? 'visto' : 'sello'
                                                }
                                            >
                                                {sale.status === 'completed'
                                                    ? 'Completada'
                                                    : 'Cancelada'}
                                            </Distintivo>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
