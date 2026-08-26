import Selector from '@/Components/ui/Selector';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Branch } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Category {
    id: number;
    name: string;
}

interface InventoryRow {
    id: number;
    stock: string;
    product: { id: number; name: string; code: string | null };
    branch: { id: number; name: string };
}

export default function Index({
    inventories,
    branches,
    categories,
    filtros,
}: {
    inventories: InventoryRow[];
    branches: Branch[];
    categories: Category[];
    filtros: { branch_id?: string; category_id?: string; buscar?: string };
}) {
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const form = useForm({ stock: '' });

    const aplicarFiltro = (clave: string, valor: string) => {
        router.get(
            route('inventario.index'),
            { ...filtros, [clave]: valor || undefined },
            { preserveState: true, replace: true },
        );
    };

    const abrirAjuste = (inventory: InventoryRow) => {
        form.setData('stock', inventory.stock);
        form.clearErrors();
        setEditandoId(inventory.id);
    };

    const guardarAjuste: FormEventHandler = (e) => {
        e.preventDefault();
        if (editandoId === null) return;

        form.put(route('inventario.update', editandoId), {
            preserveScroll: true,
            onSuccess: () => setEditandoId(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="font-display text-titulo font-bold text-tinta">Inventario</h1>}
        >
            <Head title="Inventario" />

            <div className="p-6">
                <div className="mb-4 flex gap-3">
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
                        aria-label="Filtrar por categoría"
                        value={filtros.category_id ?? ''}
                        onChange={(e) => aplicarFiltro('category_id', e.target.value)}
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </Selector>
                    <input
                        aria-label="Buscar por nombre o código"
                        placeholder="Buscar por nombre o código"
                        defaultValue={filtros.buscar ?? ''}
                        onBlur={(e) => aplicarFiltro('buscar', e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') aplicarFiltro('buscar', e.currentTarget.value);
                        }}
                        className="h-11 flex-1 rounded border border-linea-fuerte px-3 text-base text-tinta focus:border-boligrafo focus:outline-none focus:ring-1 focus:ring-boligrafo"
                    />
                </div>

                <table className="w-full border-collapse border border-linea-fuerte bg-white">
                    <thead>
                        <tr className="border-b border-linea-fuerte">
                            <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                Producto
                            </th>
                            <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                Sucursal
                            </th>
                            <th className="p-3 text-right font-mono text-micro uppercase text-grafito">
                                Existencia
                            </th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {inventories.map((inventory) => {
                            const sinExistencia = Number(inventory.stock) <= 0;

                            return (
                                <tr
                                    key={inventory.id}
                                    className={`border-b border-linea ${sinExistencia ? 'bg-sello-tenue' : ''}`}
                                >
                                    <td className="p-3 text-cuerpo text-tinta">
                                        {inventory.product.name}{' '}
                                        {inventory.product.code && (
                                            <span className="font-mono text-fino text-grafito">
                                                · {inventory.product.code}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-base text-grafito">
                                        {inventory.branch.name}
                                    </td>
                                    <td className="p-3 text-right">
                                        {editandoId === inventory.id ? (
                                            <form
                                                onSubmit={guardarAjuste}
                                                className="flex items-center justify-end gap-2"
                                            >
                                                <input
                                                    autoFocus
                                                    inputMode="decimal"
                                                    value={form.data.stock}
                                                    onChange={(e) =>
                                                        form.setData('stock', e.target.value)
                                                    }
                                                    className="h-9 w-24 rounded border border-linea-fuerte px-2 text-right font-mono text-base"
                                                />
                                                <button
                                                    type="submit"
                                                    className="font-mono text-fino text-boligrafo"
                                                >
                                                    Guardar
                                                </button>
                                            </form>
                                        ) : (
                                            <span
                                                className={`font-mono text-base ${sinExistencia ? 'font-semibold text-sello' : 'text-tinta'}`}
                                            >
                                                {inventory.stock}
                                            </span>
                                        )}
                                        {form.errors.stock && editandoId === inventory.id && (
                                            <p className="text-fino text-sello">
                                                {form.errors.stock}
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        {editandoId !== inventory.id && (
                                            <button
                                                onClick={() => abrirAjuste(inventory)}
                                                className="font-mono text-fino text-boligrafo"
                                            >
                                                Ajustar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}
