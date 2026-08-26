import Boton from '@/Components/ui/Boton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatearFechaHora } from '@/lib/fecha';
import { formatearPesos } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';

interface TurnoAbierto {
    id: number;
    opening_amount_cents: number;
    opened_at: string;
}

export default function Dashboard({
    ventasHoy,
    ingresoHoyCents,
    gananciaHoyCents,
    turnoAbierto,
    productosStockBajo,
}: {
    ventasHoy: number;
    ingresoHoyCents: number;
    gananciaHoyCents: number;
    turnoAbierto: TurnoAbierto | null;
    productosStockBajo: number;
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Tablero" />

            <div className="p-6">
                <h1 className="mb-5 font-display text-titulo font-bold text-tinta">Tablero</h1>

                <div className="mb-6 grid grid-cols-4 gap-3">
                    <div className="border border-linea-fuerte bg-white p-4">
                        <div className="font-mono text-micro uppercase text-grafito">
                            Ventas de hoy
                        </div>
                        <div className="mt-1.5 font-display text-cifra font-bold text-tinta">
                            {ventasHoy}
                        </div>
                    </div>
                    <div className="border border-linea-fuerte bg-white p-4">
                        <div className="font-mono text-micro uppercase text-grafito">
                            Ingreso de hoy
                        </div>
                        <div className="mt-1.5 font-display text-cifra font-bold text-tinta">
                            {formatearPesos(ingresoHoyCents)}
                        </div>
                    </div>
                    <div className="border border-linea-fuerte bg-white p-4">
                        <div className="font-mono text-micro uppercase text-grafito">
                            Ganancia de hoy
                        </div>
                        <div className="mt-1.5 font-display text-cifra font-bold text-visto">
                            {formatearPesos(gananciaHoyCents)}
                        </div>
                    </div>
                    <div
                        className={`border p-4 ${
                            productosStockBajo > 0 ? 'border-sello' : 'border-linea-fuerte bg-white'
                        }`}
                    >
                        <div
                            className={`font-mono text-micro uppercase ${
                                productosStockBajo > 0 ? 'text-sello' : 'text-grafito'
                            }`}
                        >
                            Stock bajo
                        </div>
                        <div
                            className={`mt-1.5 font-display text-cifra font-bold ${
                                productosStockBajo > 0 ? 'text-sello' : 'text-tinta'
                            }`}
                        >
                            {productosStockBajo}
                        </div>
                    </div>
                </div>

                {turnoAbierto && (
                    <div className="mb-6 flex items-center justify-between border border-visto bg-visto-tenue p-4">
                        <div>
                            <div className="font-mono text-micro uppercase text-visto">
                                Turno abierto
                            </div>
                            <div className="text-base font-semibold text-tinta">
                                Desde las {formatearFechaHora(turnoAbierto.opened_at)} · Fondo{' '}
                                {formatearPesos(turnoAbierto.opening_amount_cents)}
                            </div>
                        </div>
                        <Link href={route('turnos.show', turnoAbierto.id)}>
                            <Boton variante="secundaria">Ver turno</Boton>
                        </Link>
                    </div>
                )}

                <div className="flex gap-3">
                    <Link href={route('caja')} className="flex-1">
                        <Boton className="h-14 w-full text-base">Ir a caja</Boton>
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
