import { PropsWithChildren } from 'react';

type Tono = 'visto' | 'sello' | 'grafito';

const clasesPorTono: Record<Tono, string> = {
    visto: 'bg-visto-tenue text-visto',
    sello: 'bg-sello-tenue text-sello',
    grafito: 'bg-papel-hondo text-grafito',
};

export default function Distintivo({ tono, children }: PropsWithChildren<{ tono: Tono }>) {
    return (
        <span
            className={`inline-block whitespace-nowrap rounded-sm px-2 py-0.5 font-mono text-micro uppercase ${clasesPorTono[tono]}`}
        >
            {children}
        </span>
    );
}
