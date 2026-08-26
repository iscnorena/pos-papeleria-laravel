import Boton from '@/Components/ui/Boton';
import Campo from '@/Components/ui/Campo';
import Distintivo from '@/Components/ui/Distintivo';
import Selector from '@/Components/ui/Selector';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { centavosAPesos, formatearPesos } from '@/lib/money';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    code: string | null;
    category_id: number | null;
    category: Category | null;
    cost_price_cents: number;
    sale_price_cents: number;
    manages_inventory: boolean;
    is_active: boolean;
}

export default function Index({
    products,
    categories,
}: {
    products: Product[];
    categories: Category[];
}) {
    const [editando, setEditando] = useState<Product | null>(null);
    const [creando, setCreando] = useState(false);

    const form = useForm({
        name: '',
        code: '',
        category_id: '' as number | '',
        cost_price: '',
        sale_price: '',
        manages_inventory: true as boolean,
        is_active: true as boolean,
    });

    const abrirCreacion = () => {
        form.reset();
        form.clearErrors();
        setEditando(null);
        setCreando(true);
    };

    const abrirEdicion = (product: Product) => {
        form.setData({
            name: product.name,
            code: product.code ?? '',
            category_id: product.category_id ?? '',
            cost_price: centavosAPesos(product.cost_price_cents),
            sale_price: centavosAPesos(product.sale_price_cents),
            manages_inventory: product.manages_inventory,
            is_active: product.is_active,
        });
        form.clearErrors();
        setEditando(product);
        setCreando(true);
    };

    const cerrar = () => {
        setCreando(false);
        setEditando(null);
    };

    const enviar: FormEventHandler = (e) => {
        e.preventDefault();

        const opciones = { onSuccess: cerrar };

        if (editando) {
            form.put(route('productos.update', editando.id), opciones);
        } else {
            form.post(route('productos.store'), opciones);
        }
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="font-display text-titulo font-bold text-tinta">Productos</h1>}
        >
            <Head title="Productos" />

            <div className="flex">
                <div className="flex-1 p-6">
                    <div className="mb-4 flex justify-end">
                        <Boton onClick={abrirCreacion}>Nuevo producto</Boton>
                    </div>

                    <table className="w-full border-collapse border border-linea-fuerte bg-white">
                        <thead>
                            <tr className="border-b border-linea-fuerte">
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Nombre
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Código
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Categoría
                                </th>
                                <th className="p-3 text-right font-mono text-micro uppercase text-grafito">
                                    Costo
                                </th>
                                <th className="p-3 text-right font-mono text-micro uppercase text-grafito">
                                    Precio
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Estado
                                </th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b border-linea">
                                    <td className="p-3 text-cuerpo text-tinta">{product.name}</td>
                                    <td className="p-3 font-mono text-base text-grafito">
                                        {product.code ?? '—'}
                                    </td>
                                    <td className="p-3 text-base text-grafito">
                                        {product.category?.name ?? '—'}
                                    </td>
                                    <td className="p-3 text-right font-mono text-base text-tinta">
                                        {formatearPesos(product.cost_price_cents)}
                                    </td>
                                    <td className="p-3 text-right font-mono text-base text-tinta">
                                        {formatearPesos(product.sale_price_cents)}
                                    </td>
                                    <td className="p-3">
                                        <Distintivo tono={product.is_active ? 'visto' : 'sello'}>
                                            {product.is_active ? 'Activo' : 'Inactivo'}
                                        </Distintivo>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => abrirEdicion(product)}
                                            className="font-mono text-fino text-boligrafo"
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {creando && (
                    <div className="w-80 shrink-0 border-l border-linea-fuerte bg-white p-6">
                        <h2 className="mb-4 font-display text-cuerpo font-bold text-tinta">
                            {editando ? 'Editar producto' : 'Nuevo producto'}
                        </h2>
                        <form onSubmit={enviar} className="flex flex-col gap-4">
                            <Campo
                                etiqueta="Nombre"
                                name="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                error={form.errors.name}
                            />
                            <Campo
                                etiqueta="Código"
                                name="code"
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value)}
                                error={form.errors.code}
                            />
                            <Selector
                                etiqueta="Categoría"
                                name="category_id"
                                value={form.data.category_id}
                                onChange={(e) =>
                                    form.setData(
                                        'category_id',
                                        e.target.value ? Number(e.target.value) : '',
                                    )
                                }
                                error={form.errors.category_id}
                            >
                                <option value="">Sin categoría</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </Selector>
                            <div className="flex gap-3">
                                <Campo
                                    etiqueta="Costo"
                                    name="cost_price"
                                    inputMode="decimal"
                                    value={form.data.cost_price}
                                    onChange={(e) => form.setData('cost_price', e.target.value)}
                                    error={form.errors.cost_price}
                                />
                                <Campo
                                    etiqueta="Precio"
                                    name="sale_price"
                                    inputMode="decimal"
                                    value={form.data.sale_price}
                                    onChange={(e) => form.setData('sale_price', e.target.value)}
                                    error={form.errors.sale_price}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-base text-tinta">
                                <input
                                    type="checkbox"
                                    checked={form.data.manages_inventory}
                                    onChange={(e) =>
                                        form.setData('manages_inventory', e.target.checked)
                                    }
                                />
                                Maneja inventario
                            </label>
                            <label className="flex items-center gap-2 text-base text-tinta">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                Activo
                            </label>
                            <div className="mt-2 flex gap-2">
                                <Boton type="submit" disabled={form.processing} className="flex-1">
                                    Guardar
                                </Boton>
                                <Boton type="button" variante="secundaria" onClick={cerrar}>
                                    Cancelar
                                </Boton>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
