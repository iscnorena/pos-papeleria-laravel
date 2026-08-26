import Boton from '@/Components/ui/Boton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { descargarCsv } from '@/lib/csv';
import { formatearPesos } from '@/lib/money';
import { MetodoPago, PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

type TipoReporte = 'diario' | 'sucursales' | 'cajeras';

const RUTA_POR_TIPO: Record<TipoReporte, string> = {
    diario: 'reportes.diario',
    sucursales: 'reportes.sucursales',
    cajeras: 'reportes.cajeras',
};

const ETIQUETA_POR_TIPO: Record<TipoReporte, string> = {
    diario: 'Por día',
    sucursales: 'Por sucursal',
    cajeras: 'Por cajera',
};

interface Fila {
    etiqueta: string;
    ventas: number;
    ingresoCents: number;
    costoCents: number;
    gananciaCents: number;
}

interface Pago {
    method: MetodoPago;
    totalCents: number;
}

interface Totales {
    ventas: number;
    ingresoCents: number;
    costoCents: number;
    gananciaCents: number;
}

export default function Index({
    tipo,
    columnaEtiqueta,
    desde,
    hasta,
    filas,
    totales,
    pagos,
}: {
    tipo: TipoReporte;
    columnaEtiqueta: string;
    desde: string;
    hasta: string;
    filas: Fila[];
    totales: Totales;
    pagos: Pago[];
}) {
    const { pos } = usePage<PageProps>().props;

    const aplicarRango = (clave: 'desde' | 'hasta', valor: string) => {
        router.get(
            route(RUTA_POR_TIPO[tipo]),
            { desde, hasta, [clave]: valor },
            { preserveState: true, replace: true },
        );
    };

    const exportar = () => {
        descargarCsv(
            `reporte-${tipo}-${desde}-a-${hasta}.csv`,
            [columnaEtiqueta, 'Ventas', 'Ingreso', 'Costo', 'Ganancia'],
            filas.map((fila) => [
                fila.etiqueta,
                fila.ventas,
                (fila.ingresoCents / 100).toFixed(2),
                (fila.costoCents / 100).toFixed(2),
                (fila.gananciaCents / 100).toFixed(2),
            ]),
        );
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="font-display text-titulo font-bold text-tinta">Reportes</h1>}
        >
            <Head title="Reportes" />

            <div className="p-6">
                <div className="mb-4 flex gap-2">
                    {(Object.keys(RUTA_POR_TIPO) as TipoReporte[]).map((clave) => (
                        <Link
                            key={clave}
                            href={route(RUTA_POR_TIPO[clave], { desde, hasta })}
                            className={`flex h-9 items-center rounded px-3 font-mono text-fino font-semibold ${
                                tipo === clave
                                    ? 'bg-boligrafo text-white'
                                    : 'border border-linea-fuerte bg-white text-tinta hover:bg-papel-hondo'
                            }`}
                        >
                            {ETIQUETA_POR_TIPO[clave]}
                        </Link>
                    ))}
                </div>

                <div className="mb-5 flex items-center gap-3">
                    <input
                        type="date"
                        aria-label="Desde"
                        value={desde}
                        max={hasta}
                        onChange={(e) => aplicarRango('desde', e.target.value)}
                        className="h-11 rounded border border-linea-fuerte px-3 text-base text-tinta focus:border-boligrafo focus:outline-none focus:ring-1 focus:ring-boligrafo"
                    />
                    <span className="font-mono text-fino text-grafito">a</span>
                    <input
                        type="date"
                        aria-label="Hasta"
                        value={hasta}
                        min={desde}
                        onChange={(e) => aplicarRango('hasta', e.target.value)}
                        className="h-11 rounded border border-linea-fuerte px-3 text-base text-tinta focus:border-boligrafo focus:outline-none focus:ring-1 focus:ring-boligrafo"
                    />
                    <div className="flex-1" />
                    <Boton variante="secundaria" onClick={exportar} disabled={filas.length === 0}>
                        Exportar CSV
                    </Boton>
                </div>

                <div className="mb-5 grid grid-cols-4 gap-3">
                    {[
                        ['Ventas', String(totales.ventas)],
                        ['Ingreso', formatearPesos(totales.ingresoCents)],
                        ['Costo', formatearPesos(totales.costoCents)],
                        ['Ganancia', formatearPesos(totales.gananciaCents)],
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

                <div className="flex gap-5">
                    <table className="flex-[2] border-collapse border border-linea-fuerte bg-white">
                        <thead>
                            <tr className="border-b border-linea-fuerte">
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    {columnaEtiqueta}
                                </th>
                                <th className="p-3 text-right font-mono text-micro uppercase text-grafito">
                                    Ventas
                                </th>
                                <th className="p-3 text-right font-mono text-micro uppercase text-grafito">
                                    Ingreso
                                </th>
                                <th className="p-3 text-right font-mono text-micro uppercase text-grafito">
                                    Ganancia
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map((fila) => (
                                <tr
                                    key={fila.etiqueta}
                                    className="border-b border-linea last:border-0"
                                >
                                    <td className="p-3 text-base text-tinta">{fila.etiqueta}</td>
                                    <td className="p-3 text-right font-mono text-base text-tinta">
                                        {fila.ventas}
                                    </td>
                                    <td className="p-3 text-right font-mono text-base text-tinta">
                                        {formatearPesos(fila.ingresoCents)}
                                    </td>
                                    <td className="p-3 text-right font-mono text-base text-visto">
                                        {formatearPesos(fila.gananciaCents)}
                                    </td>
                                </tr>
                            ))}
                            {filas.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="p-8 text-center font-mono text-fino text-grafito"
                                    >
                                        No hay ventas en este rango.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="h-fit flex-1 border border-linea-fuerte bg-white p-4">
                        <div className="mb-2 font-mono text-micro uppercase text-grafito">
                            Por método de pago
                        </div>
                        {pagos.map((pago) => (
                            <div key={pago.method} className="flex justify-between py-0.5">
                                <span className="text-base text-tinta">
                                    {pos.metodosPago[pago.method]}
                                </span>
                                <span className="font-mono text-base text-tinta">
                                    {formatearPesos(pago.totalCents)}
                                </span>
                            </div>
                        ))}
                        {pagos.length === 0 && (
                            <div className="font-mono text-fino text-grafito">
                                Sin pagos en este rango.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
