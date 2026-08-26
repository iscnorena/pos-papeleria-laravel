import Boton from '@/Components/ui/Boton';
import Campo from '@/Components/ui/Campo';
import Modal from '@/Components/ui/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatearPesos, pesosACentavos } from '@/lib/money';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface ShiftRow {
    id: number;
}

export default function Close({
    shift,
    expectedCashCents,
}: {
    shift: ShiftRow;
    expectedCashCents: number;
}) {
    const [confirmando, setConfirmando] = useState(false);
    const form = useForm({ actual_cash: '' });

    const actualCashCents = pesosACentavos(form.data.actual_cash);
    const diferenciaCents = actualCashCents === null ? null : actualCashCents - expectedCashCents;

    const tono =
        diferenciaCents === null || diferenciaCents === 0
            ? 'visto'
            : diferenciaCents < 0
              ? 'sello'
              : 'grafito';

    const clasesPorTono = {
        visto: { fondo: 'bg-visto-tenue', borde: 'border-visto', texto: 'text-visto' },
        sello: { fondo: 'bg-sello-tenue', borde: 'border-sello', texto: 'text-sello' },
        grafito: { fondo: 'bg-papel-hondo', borde: 'border-linea-fuerte', texto: 'text-grafito' },
    } as const;

    const confirmar: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(route('turnos.cerrar.store', shift.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Cerrar turno" />

            <div className="flex justify-center p-12">
                <div className="w-full max-w-md border border-linea-fuerte bg-white p-8 shadow-alzada">
                    <h1 className="mb-5 font-display text-titulo font-bold text-tinta">
                        Cerrar turno
                    </h1>

                    <div className="mb-5 flex items-baseline justify-between">
                        <span className="font-mono text-micro uppercase text-grafito">
                            Efectivo esperado
                        </span>
                        <span className="font-mono text-cifra font-semibold text-tinta">
                            {formatearPesos(expectedCashCents)}
                        </span>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setConfirmando(true);
                        }}
                        className="flex flex-col gap-5"
                    >
                        <Campo
                            etiqueta="Efectivo contado"
                            name="actual_cash"
                            inputMode="decimal"
                            autoFocus
                            value={form.data.actual_cash}
                            onChange={(e) => form.setData('actual_cash', e.target.value)}
                            error={form.errors.actual_cash}
                        />

                        <div
                            className={`flex flex-col items-center gap-1 border p-4 ${clasesPorTono[tono].fondo} ${clasesPorTono[tono].borde}`}
                        >
                            <span
                                className={`font-mono text-micro uppercase ${clasesPorTono[tono].texto}`}
                            >
                                Diferencia
                            </span>
                            <span
                                className={`font-display text-total font-bold ${clasesPorTono[tono].texto}`}
                            >
                                {diferenciaCents === null ? '—' : formatearPesos(diferenciaCents)}
                            </span>
                            {diferenciaCents !== null && (
                                <span className={`text-fino ${clasesPorTono[tono].texto}`}>
                                    {diferenciaCents === 0
                                        ? 'Cuadra exacto'
                                        : diferenciaCents < 0
                                          ? 'Falta dinero'
                                          : 'Sobra dinero'}
                                </span>
                            )}
                        </div>

                        <Boton
                            type="submit"
                            variante="destructiva"
                            disabled={actualCashCents === null}
                        >
                            Confirmar cierre
                        </Boton>
                        <span className="text-center font-mono text-micro text-grafito">
                            Esta acción es irreversible
                        </span>
                    </form>
                </div>
            </div>

            <Modal
                abierto={confirmando}
                onCerrar={() => setConfirmando(false)}
                titulo="¿Cerrar el turno?"
            >
                <p className="mb-5 text-base text-tinta">
                    Una vez cerrado no se puede reabrir. Verifica el efectivo contado antes de
                    confirmar.
                </p>
                <div className="flex gap-2">
                    <Boton
                        variante="destructiva"
                        className="flex-1"
                        disabled={form.processing}
                        onClick={confirmar}
                    >
                        Sí, cerrar turno
                    </Boton>
                    <Boton variante="secundaria" onClick={() => setConfirmando(false)}>
                        Cancelar
                    </Boton>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
