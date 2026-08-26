import Boton from '@/Components/ui/Boton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatearPesos } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';

interface SaleSuccess {
    id: number;
    ticket_number: string;
    public_token: string;
}

export default function Success({ sale, changeCents }: { sale: SaleSuccess; changeCents: number }) {
    return (
        <AuthenticatedLayout>
            <Head title="Venta completada" />

            <div className="flex justify-center p-12">
                <div className="flex w-full max-w-sm flex-col items-center gap-5 border border-linea-fuerte bg-white p-8 text-center shadow-alzada">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-visto-tenue text-visto">
                        ✓
                    </div>
                    <div className="font-mono text-fino tracking-wide text-grafito">
                        {sale.ticket_number}
                    </div>

                    <div className="w-full border border-visto bg-visto-tenue p-5">
                        <div className="text-center font-mono text-micro uppercase text-visto">
                            Cambio
                        </div>
                        <div className="text-center font-display text-total font-bold text-visto">
                            {formatearPesos(changeCents)}
                        </div>
                    </div>

                    <div className="flex w-full gap-3">
                        <a
                            href={route('ticket.show', {
                                token: sale.public_token,
                                cambio_cents: changeCents,
                            })}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1"
                        >
                            <Boton variante="secundaria" className="w-full">
                                Imprimir ticket
                            </Boton>
                        </a>
                        <Link href={route('caja')} className="flex-1">
                            <Boton className="w-full">Nueva venta</Boton>
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
