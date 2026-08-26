import Boton from '@/Components/ui/Boton';
import Distintivo from '@/Components/ui/Distintivo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatearFechaHora } from '@/lib/fecha';
import { formatearPesos } from '@/lib/money';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

interface ShiftRow {
    id: number;
    opening_amount_cents: number;
    difference_cents: number | null;
    opened_at: string;
    closed_at: string | null;
    user: { id: number; name: string };
    branch: { name: string };
}

export default function Index({
    openShift,
    closedShifts,
}: {
    openShift: ShiftRow | null;
    closedShifts: ShiftRow[];
}) {
    const { auth } = usePage<PageProps>().props;
    const esMiTurno = openShift && auth.user?.id === openShift.user.id;

    return (
        <AuthenticatedLayout
            header={<h1 className="font-display text-titulo font-bold text-tinta">Turnos</h1>}
        >
            <Head title="Turnos" />

            <div className="p-6">
                {openShift ? (
                    <div className="mb-6 flex items-center justify-between border border-visto bg-visto-tenue p-5">
                        <div className="flex items-center gap-4">
                            <Distintivo tono="visto">Abierto</Distintivo>
                            <div>
                                <div className="text-cuerpo font-semibold text-tinta">
                                    {openShift.user.name} · {openShift.branch.name}
                                </div>
                                <div className="font-mono text-fino text-grafito">
                                    Fondo {formatearPesos(openShift.opening_amount_cents)} · abierto{' '}
                                    {formatearFechaHora(openShift.opened_at)}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href={route('turnos.show', openShift.id)}>
                                <Boton variante="secundaria">Ver detalle</Boton>
                            </Link>
                            {esMiTurno && (
                                <Link href={route('turnos.cerrar', openShift.id)}>
                                    <Boton variante="destructiva">Cerrar turno</Boton>
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 flex items-center justify-between border border-linea-fuerte bg-white p-5">
                        <span className="text-base text-grafito">No tienes un turno abierto.</span>
                        <Link href={route('turnos.abrir')}>
                            <Boton>Abrir turno</Boton>
                        </Link>
                    </div>
                )}

                <h2 className="mb-2 font-mono text-micro uppercase text-grafito">Historial</h2>
                {closedShifts.length === 0 ? (
                    <div className="border border-linea-fuerte bg-white p-8 text-center font-mono text-fino text-grafito">
                        Aún no hay turnos cerrados.
                    </div>
                ) : (
                    <table className="w-full border-collapse border border-linea-fuerte bg-white">
                        <thead>
                            <tr className="border-b border-linea-fuerte">
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Cajera
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Sucursal
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Abierto
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Cerrado
                                </th>
                                <th className="p-3 text-right font-mono text-micro uppercase text-grafito">
                                    Diferencia
                                </th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {closedShifts.map((shift) => (
                                <tr key={shift.id} className="border-b border-linea last:border-0">
                                    <td className="p-3 text-base text-tinta">{shift.user.name}</td>
                                    <td className="p-3 text-base text-grafito">
                                        {shift.branch.name}
                                    </td>
                                    <td className="p-3 font-mono text-fino text-grafito">
                                        {formatearFechaHora(shift.opened_at)}
                                    </td>
                                    <td className="p-3 font-mono text-fino text-grafito">
                                        {shift.closed_at && formatearFechaHora(shift.closed_at)}
                                    </td>
                                    <td
                                        className={`p-3 text-right font-mono text-base font-semibold ${
                                            !shift.difference_cents
                                                ? 'text-visto'
                                                : shift.difference_cents < 0
                                                  ? 'text-sello'
                                                  : 'text-grafito'
                                        }`}
                                    >
                                        {formatearPesos(shift.difference_cents ?? 0)}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Link
                                            href={route('turnos.show', shift.id)}
                                            className="font-mono text-fino text-boligrafo"
                                        >
                                            Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
