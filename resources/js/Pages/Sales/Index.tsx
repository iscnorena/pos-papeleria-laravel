import Distintivo from '@/Components/ui/Distintivo';
import Selector from '@/Components/ui/Selector';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatearFechaHora } from '@/lib/fecha';
import { formatearPesos } from '@/lib/money';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface SaleRow {
    id: number;
    ticket_number: string;
    status: 'completed' | 'cancelled';
    total_cents: number;
    created_at: string;
    user: { id: number; name: string };
    branch: { id: number; name: string };
}

interface Filtros {
    branch_id?: string;
    user_id?: string;
    status?: string;
    desde?: string;
    hasta?: string;
}

export default function Index({
    sales,
    branches,
    cashiers,
    filtros,
}: {
    sales: SaleRow[];
    branches: { id: number; name: string }[];
    cashiers: { id: number; name: string }[];
    filtros: Filtros;
}) {
    const { auth } = usePage<PageProps>().props;
    const esAdmin = auth.user?.role === 'admin';

    const aplicarFiltro = (clave: keyof Filtros, valor: string) => {
        router.get(
            route('ventas.index'),
            { ...filtros, [clave]: valor || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h1 className="font-display text-titulo font-bold text-tinta">
                    Historial de ventas
                </h1>
            }
        >
            <Head title="Historial de ventas" />

            <div className="p-6">
                <div className="mb-4 flex flex-wrap gap-3">
                    <input
                        type="date"
                        aria-label="Desde"
                        value={filtros.desde ?? ''}
                        onChange={(e) => aplicarFiltro('desde', e.target.value)}
                        className="h-11 rounded border border-linea-fuerte px-3 text-base text-tinta focus:border-boligrafo focus:outline-none focus:ring-1 focus:ring-boligrafo"
                    />
                    <input
                        type="date"
                        aria-label="Hasta"
                        value={filtros.hasta ?? ''}
                        onChange={(e) => aplicarFiltro('hasta', e.target.value)}
                        className="h-11 rounded border border-linea-fuerte px-3 text-base text-tinta focus:border-boligrafo focus:outline-none focus:ring-1 focus:ring-boligrafo"
                    />
                    {esAdmin && (
                        <>
                            <Selector
                                aria-label="Filtrar por sucursal"
                                value={filtros.branch_id ?? ''}
                                onChange={(e) => aplicarFiltro('branch_id', e.target.value)}
                            >
                                <option value="">Todas las sucursales</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </Selector>
                            <Selector
                                aria-label="Filtrar por cajera"
                                value={filtros.user_id ?? ''}
                                onChange={(e) => aplicarFiltro('user_id', e.target.value)}
                            >
                                <option value="">Todas las cajeras</option>
                                {cashiers.map((cashier) => (
                                    <option key={cashier.id} value={cashier.id}>
                                        {cashier.name}
                                    </option>
                                ))}
                            </Selector>
                        </>
                    )}
                    <Selector
                        aria-label="Filtrar por estado"
                        value={filtros.status ?? ''}
                        onChange={(e) => aplicarFiltro('status', e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                    </Selector>
                </div>

                <table className="w-full border-collapse border border-linea-fuerte bg-white">
                    <thead>
                        <tr className="border-b border-linea-fuerte">
                            <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                Folio
                            </th>
                            <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                Fecha
                            </th>
                            <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                Cajera
                            </th>
                            {esAdmin && (
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Sucursal
                                </th>
                            )}
                            <th className="p-3 text-right font-mono text-micro uppercase text-grafito">
                                Total
                            </th>
                            <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale) => {
                            const cancelada = sale.status === 'cancelled';

                            return (
                                <tr
                                    key={sale.id}
                                    className={`border-b border-linea last:border-0 ${cancelada ? 'bg-sello-tenue' : ''}`}
                                >
                                    <td className="p-3">
                                        <Link
                                            href={route('ventas.show', sale.id)}
                                            className={`font-mono text-base text-boligrafo ${cancelada ? 'line-through' : ''}`}
                                        >
                                            {sale.ticket_number}
                                        </Link>
                                    </td>
                                    <td
                                        className={`p-3 font-mono text-base text-grafito ${cancelada ? 'line-through' : ''}`}
                                    >
                                        {formatearFechaHora(sale.created_at)}
                                    </td>
                                    <td
                                        className={`p-3 text-base text-tinta ${cancelada ? 'text-grafito line-through' : ''}`}
                                    >
                                        {sale.user.name}
                                    </td>
                                    {esAdmin && (
                                        <td
                                            className={`p-3 text-base text-grafito ${cancelada ? 'line-through' : ''}`}
                                        >
                                            {sale.branch.name}
                                        </td>
                                    )}
                                    <td
                                        className={`p-3 text-right font-mono text-base text-tinta ${cancelada ? 'text-grafito line-through' : ''}`}
                                    >
                                        {formatearPesos(sale.total_cents)}
                                    </td>
                                    <td className="p-3">
                                        <Distintivo tono={cancelada ? 'sello' : 'visto'}>
                                            {cancelada ? 'Cancelada' : 'Completada'}
                                        </Distintivo>
                                    </td>
                                </tr>
                            );
                        })}
                        {sales.length === 0 && (
                            <tr>
                                <td
                                    colSpan={esAdmin ? 6 : 5}
                                    className="p-8 text-center font-mono text-fino text-grafito"
                                >
                                    No hay ventas con estos filtros.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}
