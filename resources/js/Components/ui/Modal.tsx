import { PropsWithChildren, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = PropsWithChildren<{
    abierto: boolean;
    onCerrar: () => void;
    titulo: string;
}>;

export default function Modal({ abierto, onCerrar, titulo, children }: ModalProps) {
    useEffect(() => {
        if (!abierto) return;

        const alPresionarTecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCerrar();
        };

        window.addEventListener('keydown', alPresionarTecla);
        return () => window.removeEventListener('keydown', alPresionarTecla);
    }, [abierto, onCerrar]);

    if (!abierto) return null;

    return createPortal(
        <div className="fixed inset-0 z-capa flex items-center justify-center bg-tinta/40 p-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-titulo"
                className="w-full max-w-sm border border-linea-fuerte bg-white p-6 shadow-alzada"
            >
                <h2
                    id="modal-titulo"
                    className="mb-4 font-display text-cuerpo font-bold text-tinta"
                >
                    {titulo}
                </h2>
                {children}
            </div>
        </div>,
        document.body,
    );
}
