import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="POS Papelería" />
            <div className="min-h-screen bg-papel px-16 py-24">
                <div className="flex flex-col items-start gap-10">
                    <div className="flex flex-col gap-2">
                        <span className="font-mono text-micro uppercase text-grafito">
                            Fase 0 · Andamiaje
                        </span>
                        <h1 className="font-display text-cifra font-bold text-tinta">
                            POS Papelería
                        </h1>
                    </div>

                    <div className="flex max-w-xl flex-col gap-6 border border-linea-fuerte bg-white p-8 shadow-alzada">
                        <div>
                            <div className="mb-1.5 font-mono text-micro uppercase text-grafito">
                                display · Archivo
                            </div>
                            <div className="font-display text-titulo text-tinta">
                                Títulos y cifras
                            </div>
                        </div>
                        <div className="h-px bg-linea" />
                        <div>
                            <div className="mb-1.5 font-mono text-micro uppercase text-grafito">
                                sans · Atkinson Hyperlegible Next
                            </div>
                            <div className="text-cuerpo text-tinta-claro">
                                Cuerpo e interfaz — el texto de mostrador va aquí, en español llano.
                            </div>
                        </div>
                        <div className="h-px bg-linea" />
                        <div>
                            <div className="mb-1.5 font-mono text-micro uppercase text-grafito">
                                mono · IBM Plex Mono
                            </div>
                            <div className="font-mono text-base text-tinta">
                                BR1-20260826-0001 · $1,234.50
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border border-linea-fuerte bg-marcador-tenue px-4 py-2.5">
                        <span className="h-2 w-2 rounded-full bg-visto" />
                        <span className="font-mono text-fino text-tinta">
                            Migraciones OK · MySQL local
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
