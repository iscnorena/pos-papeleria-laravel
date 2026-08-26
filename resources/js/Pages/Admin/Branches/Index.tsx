import Boton from '@/Components/ui/Boton';
import Campo from '@/Components/ui/Campo';
import Distintivo from '@/Components/ui/Distintivo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Branch } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function Index({ branches }: { branches: Branch[] }) {
    const [editando, setEditando] = useState<Branch | null>(null);
    const [creando, setCreando] = useState(false);

    const form = useForm({
        name: '',
        address: '',
        phone: '',
        is_active: true as boolean,
    });

    const abrirCreacion = () => {
        form.reset();
        form.clearErrors();
        setEditando(null);
        setCreando(true);
    };

    const abrirEdicion = (branch: Branch) => {
        form.setData({
            name: branch.name,
            address: branch.address ?? '',
            phone: branch.phone ?? '',
            is_active: branch.is_active,
        });
        form.clearErrors();
        setEditando(branch);
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
            form.put(route('sucursales.update', editando.id), opciones);
        } else {
            form.post(route('sucursales.store'), opciones);
        }
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="font-display text-titulo font-bold text-tinta">Sucursales</h1>}
        >
            <Head title="Sucursales" />

            <div className="flex">
                <div className="flex-1 p-6">
                    <div className="mb-4 flex justify-end">
                        <Boton onClick={abrirCreacion}>Nueva sucursal</Boton>
                    </div>

                    <table className="w-full border-collapse border border-linea-fuerte bg-white">
                        <thead>
                            <tr className="border-b border-linea-fuerte">
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Nombre
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Dirección
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Teléfono
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Estado
                                </th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {branches.map((branch) => (
                                <tr key={branch.id} className="border-b border-linea">
                                    <td className="p-3 text-cuerpo text-tinta">{branch.name}</td>
                                    <td className="p-3 text-base text-grafito">
                                        {branch.address ?? '—'}
                                    </td>
                                    <td className="p-3 text-base text-grafito">
                                        {branch.phone ?? '—'}
                                    </td>
                                    <td className="p-3">
                                        <Distintivo tono={branch.is_active ? 'visto' : 'sello'}>
                                            {branch.is_active ? 'Activa' : 'Inactiva'}
                                        </Distintivo>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => abrirEdicion(branch)}
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
                            {editando ? 'Editar sucursal' : 'Nueva sucursal'}
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
                                etiqueta="Dirección"
                                name="address"
                                value={form.data.address}
                                onChange={(e) => form.setData('address', e.target.value)}
                                error={form.errors.address}
                            />
                            <Campo
                                etiqueta="Teléfono"
                                name="phone"
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', e.target.value)}
                                error={form.errors.phone}
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
