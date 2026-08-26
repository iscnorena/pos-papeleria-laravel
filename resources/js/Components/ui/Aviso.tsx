import { PropsWithChildren } from 'react';

type Tono = 'exito' | 'error';

const clasesPorTono: Record<Tono, string> = {
    exito: 'border-visto bg-visto-tenue text-visto',
    error: 'border-sello bg-sello-tenue text-sello',
};

export default function Aviso({ tono = 'exito', children }: PropsWithChildren<{ tono?: Tono }>) {
    return (
        <div
            role="alert"
            className={`border px-4 py-2.5 text-fino font-medium ${clasesPorTono[tono]}`}
        >
            {children}
        </div>
    );
}
