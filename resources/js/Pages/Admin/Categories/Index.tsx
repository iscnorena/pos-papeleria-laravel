import Boton from '@/Components/ui/Boton';
import Campo from '@/Components/ui/Campo';
import Distintivo from '@/Components/ui/Distintivo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Category {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
}

export default function Index({ categories }: { categories: Category[] }) {
    const [editando, setEditando] = useState<Category | null>(null);
    const [creando, setCreando] = useState(false);

    const form = useForm({
        name: '',
        description: '',
        is_active: true as boolean,
    });

    const abrirCreacion = () => {
        form.reset();
        form.clearErrors();
        setEditando(null);
        setCreando(true);
    };

    const abrirEdicion = (category: Category) => {
        form.setData({
            name: category.name,
            description: category.description ?? '',
            is_active: category.is_active,
        });
        form.clearErrors();
        setEditando(category);
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
            form.put(route('categorias.update', editando.id), opciones);
        } else {
            form.post(route('categorias.store'), opciones);
        }
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="font-display text-titulo font-bold text-tinta">Categorías</h1>}
        >
            <Head title="Categorías" />

            <div className="flex">
                <div className="flex-1 p-6">
                    <div className="mb-4 flex justify-end">
                        <Boton onClick={abrirCreacion}>Nueva categoría</Boton>
                    </div>

                    <table className="w-full border-collapse border border-linea-fuerte bg-white">
                        <thead>
                            <tr className="border-b border-linea-fuerte">
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Nombre
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Descripción
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Estado
                                </th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id} className="border-b border-linea">
                                    <td className="p-3 text-cuerpo text-tinta">{category.name}</td>
                                    <td className="p-3 text-base text-grafito">
                                        {category.description ?? '—'}
                                    </td>
                                    <td className="p-3">
                                        <Distintivo tono={category.is_active ? 'visto' : 'sello'}>
                                            {category.is_active ? 'Activa' : 'Inactiva'}
                                        </Distintivo>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => abrirEdicion(category)}
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
                            {editando ? 'Editar categoría' : 'Nueva categoría'}
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
                                etiqueta="Descripción"
                                name="description"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                error={form.errors.description}
                            />
                            <label className="flex items-center gap-2 text-base text-tinta">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                Activa
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
