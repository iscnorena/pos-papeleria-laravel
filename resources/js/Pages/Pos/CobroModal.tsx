import Boton from '@/Components/ui/Boton';
import Modal from '@/Components/ui/Modal';
import { centavosAPesos, formatearPesos, pesosACentavos } from '@/lib/money';
import { MetodoPago } from '@/types';
import { FormEventHandler, useState } from 'react';

const IMPORTES_RAPIDOS = [5000, 10000, 20000, 50000]; // centavos: $50, $100, $200, $500

interface Pago {
    method: MetodoPago;
    amountCents: number;
}

export default function CobroModal({
    abierto,
    onCerrar,
    totalCents,
    metodosPago,
    onConfirmar,
    procesando,
}: {
    abierto: boolean;
    onCerrar: () => void;
    totalCents: number;
    metodosPago: Record<MetodoPago, string>;
    onConfirmar: (pagos: Pago[]) => void;
    procesando: boolean;
}) {
    const [metodo, setMetodo] = useState<MetodoPago>('cash');
    const [montoTexto, setMontoTexto] = useState('');
    const [pagos, setPagos] = useState<Pago[]>([]);

    const pagadoCents = pagos.reduce((suma, p) => suma + p.amountCents, 0);
    const restanteCents = Math.max(0, totalCents - pagadoCents);
    const cambioCents = pagadoCents - totalCents;
    const alcanza = pagadoCents >= totalCents && pagos.length > 0;

    const agregarPago: FormEventHandler = (e) => {
        e.preventDefault();
        const monto = pesosACentavos(montoTexto);
        if (monto === null || monto <= 0) return;

        setPagos((actuales) => [...actuales, { method: metodo, amountCents: monto }]);
        setMontoTexto('');
    };

    const quitarPago = (indice: number) => {
        setPagos((actuales) => actuales.filter((_, i) => i !== indice));
    };

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Cobrar">
            <div className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between bg-marcador-tenue p-4">
                    <span className="font-mono text-micro uppercase text-tinta">Total</span>
                    <span className="font-display text-cifra font-bold text-tinta">
                        {formatearPesos(totalCents)}
                    </span>
                </div>

                <div className="flex gap-2">
                    {(Object.keys(metodosPago) as MetodoPago[]).map((clave) => (
                        <button
                            key={clave}
                            type="button"
                            onClick={() => setMetodo(clave)}
                            className={`flex-1 rounded border py-2 font-mono text-fino ${
                                metodo === clave
                                    ? 'border-boligrafo bg-boligrafo text-white'
                                    : 'border-linea-fuerte bg-white text-tinta'
                            }`}
                        >
                            {metodosPago[clave]}
                        </button>
                    ))}
                </div>

                <form onSubmit={agregarPago} className="flex gap-2">
                    <input
                        aria-label="Importe del pago"
                        inputMode="decimal"
                        autoFocus
                        value={montoTexto}
                        onChange={(e) => setMontoTexto(e.target.value)}
                        className="h-11 flex-1 rounded border border-linea-fuerte px-3 font-mono text-base"
                    />
                    <Boton type="submit" variante="secundaria">
                        Agregar
                    </Boton>
                </form>

                <div className="flex gap-1.5">
                    {IMPORTES_RAPIDOS.map((importe) => (
                        <button
                            key={importe}
                            type="button"
                            onClick={() => setMontoTexto(centavosAPesos(importe))}
                            className="flex-1 rounded border border-linea-fuerte py-1.5 font-mono text-fino text-tinta hover:bg-papel-hondo"
                        >
                            {formatearPesos(importe)}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setMontoTexto(centavosAPesos(restanteCents))}
                        className="flex-1 rounded border border-boligrafo py-1.5 font-mono text-fino text-boligrafo hover:bg-boligrafo-tenue"
                    >
                        Exacto
                    </button>
                </div>

                {pagos.length > 0 && (
                    <div className="flex flex-col gap-1.5 border-t border-linea pt-3">
                        {pagos.map((pago, indice) => (
                            <div
                                key={indice}
                                className="flex items-center justify-between text-base"
                            >
                                <span>{metodosPago[pago.method]}</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono">
                                        {formatearPesos(pago.amountCents)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => quitarPago(indice)}
                                        className="font-mono text-fino text-sello"
                                        aria-label={`Quitar pago de ${metodosPago[pago.method]}`}
                                    >
                                        Quitar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div
                    className={`flex items-baseline justify-between border p-3 ${
                        cambioCents >= 0
                            ? 'border-visto bg-visto-tenue text-visto'
                            : 'border-linea-fuerte bg-papel-hondo text-grafito'
                    }`}
                >
                    <span className="font-mono text-micro uppercase">
                        {cambioCents >= 0 ? 'Cambio' : 'Falta'}
                    </span>
                    <span className="font-display text-titulo font-bold">
                        {formatearPesos(Math.abs(cambioCents))}
                    </span>
                </div>

                <Boton
                    onClick={() => onConfirmar(pagos)}
                    disabled={!alcanza || procesando}
                    className="h-12"
                >
                    Confirmar cobro
                </Boton>
            </div>
        </Modal>
    );
}
