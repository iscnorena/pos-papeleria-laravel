import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

/**
 * Cascarón mínimo para la Fase 1. La navegación lateral y el indicador de
 * sucursal activa (§8, Fase 2) se agregan cuando exista algo a lo que navegar.
 */
export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, pos } = usePage<PageProps>().props;

    return (
        <div className="min-h-screen bg-papel">
            <header className="flex h-14 items-center justify-between border-b border-linea bg-white px-6">
                <span className="font-display text-cuerpo font-bold text-tinta">
                    {pos.nombreNegocio}
                </span>

                <div className="flex items-center gap-4">
                    {auth.user && (
                        <span className="font-mono text-fino text-grafito">{auth.user.name}</span>
                    )}
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="font-mono text-fino text-grafito hover:text-tinta"
                    >
                        Cerrar sesión
                    </Link>
                </div>
            </header>

            {header && <div className="border-b border-linea bg-white px-6 py-4">{header}</div>}

            <main>{children}</main>
        </div>
    );
}
