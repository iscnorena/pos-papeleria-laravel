import Aviso from '@/Components/ui/Aviso';
import EnlaceNav from '@/Components/ui/EnlaceNav';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

const ENLACES_COMUNES = [
    { ruta: 'dashboard', etiqueta: 'Tablero' },
    { ruta: 'turnos.index', etiqueta: 'Turnos' },
];

const ENLACES_ADMIN = [
    { ruta: 'sucursales.index', etiqueta: 'Sucursales' },
    { ruta: 'usuarios.index', etiqueta: 'Usuarios' },
    { ruta: 'categorias.index', etiqueta: 'Categorías' },
    { ruta: 'productos.index', etiqueta: 'Productos' },
    { ruta: 'inventario.index', etiqueta: 'Inventario' },
];

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, pos, flash } = usePage<PageProps>().props;
    const esAdmin = auth.user?.role === 'admin';

    return (
        <div className="flex min-h-screen bg-papel">
            {auth.user && (
                <aside className="w-56 shrink-0 border-r border-linea bg-white py-5">
                    <div className="mb-5 px-5 font-display text-cuerpo font-bold text-tinta">
                        {pos.nombreNegocio}
                    </div>
                    <nav className="flex flex-col gap-0.5">
                        {[...ENLACES_COMUNES, ...(esAdmin ? ENLACES_ADMIN : [])].map((enlace) => (
                            <EnlaceNav
                                key={enlace.ruta}
                                href={route(enlace.ruta)}
                                activo={route().current(enlace.ruta)}
                            >
                                {enlace.etiqueta}
                            </EnlaceNav>
                        ))}
                    </nav>
                </aside>
            )}

            <div className="flex flex-1 flex-col">
                <header className="flex items-center justify-end gap-4 border-b border-linea bg-white px-6 py-3">
                    {auth.user && (
                        <>
                            <span className="font-mono text-fino text-grafito">
                                {auth.user.branch.name}
                            </span>
                            <span className="font-mono text-fino text-tinta">{auth.user.name}</span>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="font-mono text-fino text-grafito hover:text-tinta"
                            >
                                Cerrar sesión
                            </Link>
                        </>
                    )}
                </header>

                {header && <div className="border-b border-linea bg-white px-6 py-4">{header}</div>}

                {(flash.success || flash.error) && (
                    <div className="px-6 pt-4">
                        {flash.success && <Aviso tono="exito">{flash.success}</Aviso>}
                        {flash.error && <Aviso tono="error">{flash.error}</Aviso>}
                    </div>
                )}

                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
