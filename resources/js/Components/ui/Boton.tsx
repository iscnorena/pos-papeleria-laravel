import { ButtonHTMLAttributes } from 'react';

type Variante = 'primaria' | 'secundaria' | 'destructiva';

const clasesPorVariante: Record<Variante, string> = {
    primaria: 'border-0 bg-boligrafo text-white shadow-alzada hover:bg-boligrafo-hondo',
    secundaria: 'border border-linea-fuerte bg-white text-tinta hover:bg-papel-hondo',
    destructiva: 'border-0 bg-sello text-white shadow-alzada hover:bg-sello-hondo',
};

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variante?: Variante;
};

export default function Boton({ variante = 'primaria', className = '', ...props }: BotonProps) {
    return (
        <button
            {...props}
            className={`h-11 rounded px-4 text-base font-semibold transition-colors duration-avance disabled:cursor-not-allowed disabled:opacity-50 ${clasesPorVariante[variante]} ${className}`}
        />
    );
}
