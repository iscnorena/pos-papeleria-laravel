import Boton from '@/Components/ui/Boton';
import Campo from '@/Components/ui/Campo';
import Distintivo from '@/Components/ui/Distintivo';
import Selector from '@/Components/ui/Selector';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Branch, Rol } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface UserRow {
    id: number;
    name: string;
    username: string;
    email: string | null;
    role: Rol;
    branch_id: number;
    branch: Branch;
    is_active: boolean;
}

export default function Index({ users, branches }: { users: UserRow[]; branches: Branch[] }) {
    const [editando, setEditando] = useState<UserRow | null>(null);
    const [creando, setCreando] = useState(false);

    const form = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        pin: '',
        role: 'cajera' as Rol,
        branch_id: '' as number | '',
        is_active: true as boolean,
    });

    const formPassword = useForm({ password: '' });
    const formPin = useForm({ pin: '' });

    const abrirCreacion = () => {
        form.reset();
        form.clearErrors();
        setEditando(null);
        setCreando(true);
    };

    const abrirEdicion = (user: UserRow) => {
        form.setData({
            name: user.name,
            username: user.username,
            email: user.email ?? '',
            password: '',
            pin: '',
            role: user.role,
            branch_id: user.branch_id,
            is_active: user.is_active,
        });
        form.clearErrors();
        formPassword.reset();
        formPin.reset();
        setEditando(user);
        setCreando(true);
    };

    const cerrar = () => {
        setCreando(false);
        setEditando(null);
    };

    const enviar: FormEventHandler = (e) => {
        e.preventDefault();

        if (editando) {
            form.put(route('usuarios.update', editando.id), { onSuccess: cerrar });
        } else {
            form.post(route('usuarios.store'), { onSuccess: cerrar });
        }
    };

    const enviarPassword: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editando) return;
        formPassword.put(route('usuarios.reset-password', editando.id), {
            onSuccess: () => formPassword.reset(),
        });
    };

    const enviarPin: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editando) return;
        formPin.put(route('usuarios.reset-pin', editando.id), {
            onSuccess: () => formPin.reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="font-display text-titulo font-bold text-tinta">Usuarios</h1>}
        >
            <Head title="Usuarios" />

            <div className="flex">
                <div className="flex-1 p-6">
                    <div className="mb-4 flex justify-end">
                        <Boton onClick={abrirCreacion}>Nuevo usuario</Boton>
                    </div>

                    <table className="w-full border-collapse border border-linea-fuerte bg-white">
                        <thead>
                            <tr className="border-b border-linea-fuerte">
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Nombre
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Usuario
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Rol
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Sucursal
                                </th>
                                <th className="p-3 text-left font-mono text-micro uppercase text-grafito">
                                    Estado
                                </th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-linea">
                                    <td className="p-3 text-cuerpo text-tinta">{user.name}</td>
                                    <td className="p-3 font-mono text-base text-grafito">
                                        {user.username}
                                    </td>
                                    <td className="p-3 text-base text-grafito">
                                        {user.role === 'admin' ? 'Admin' : 'Cajera'}
                                    </td>
                                    <td className="p-3 text-base text-grafito">
                                        {user.branch.name}
                                    </td>
                                    <td className="p-3">
                                        <Distintivo tono={user.is_active ? 'visto' : 'sello'}>
                                            {user.is_active ? 'Activo' : 'Inactivo'}
                                        </Distintivo>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => abrirEdicion(user)}
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
                            {editando ? 'Editar usuario' : 'Nuevo usuario'}
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
                                etiqueta="Usuario"
                                name="username"
                                value={form.data.username}
                                onChange={(e) => form.setData('username', e.target.value)}
                                error={form.errors.username}
                            />
                            <Campo
                                etiqueta="Correo (opcional)"
                                name="email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                error={form.errors.email}
                            />
                            {!editando && (
                                <>
                                    <Campo
                                        etiqueta="Contraseña"
                                        name="password"
                                        type="password"
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        error={form.errors.password}
                                    />
                                    <Campo
                                        etiqueta="PIN inicial (opcional)"
                                        name="pin"
                                        value={form.data.pin}
                                        onChange={(e) => form.setData('pin', e.target.value)}
                                        error={form.errors.pin}
                                    />
                                </>
                            )}
                            <Selector
                                etiqueta="Rol"
                                name="role"
                                value={form.data.role}
                                onChange={(e) => form.setData('role', e.target.value as Rol)}
                                error={form.errors.role}
                            >
                                <option value="cajera">Cajera</option>
                                <option value="admin">Admin</option>
                            </Selector>
                            <Selector
                                etiqueta="Sucursal"
                                name="branch_id"
                                value={form.data.branch_id}
                                onChange={(e) =>
                                    form.setData(
                                        'branch_id',
                                        e.target.value ? Number(e.target.value) : '',
                                    )
                                }
                                error={form.errors.branch_id}
                            >
                                <option value="">Selecciona una sucursal</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </Selector>
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

                        {editando && (
                            <div className="mt-6 flex flex-col gap-4 border-t border-linea pt-6">
                                <form onSubmit={enviarPassword} className="flex flex-col gap-2">
                                    <Campo
                                        etiqueta="Restablecer contraseña"
                                        name="reset_password"
                                        type="password"
                                        value={formPassword.data.password}
                                        onChange={(e) =>
                                            formPassword.setData('password', e.target.value)
                                        }
                                        error={formPassword.errors.password}
                                    />
                                    <Boton
                                        type="submit"
                                        variante="secundaria"
                                        disabled={formPassword.processing}
                                    >
                                        Cambiar contraseña
                                    </Boton>
                                </form>

                                <form onSubmit={enviarPin} className="flex flex-col gap-2">
                                    <Campo
                                        etiqueta="Restablecer PIN"
                                        name="reset_pin"
                                        value={formPin.data.pin}
                                        onChange={(e) => formPin.setData('pin', e.target.value)}
                                        error={formPin.errors.pin}
                                    />
                                    <Boton
                                        type="submit"
                                        variante="secundaria"
                                        disabled={formPin.processing}
                                    >
                                        Cambiar PIN
                                    </Boton>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
