import Boton from '@/Components/ui/Boton';
import Campo from '@/Components/ui/Campo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Open() {
    const form = useForm({ opening_amount: '' });

    const enviar: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('turnos.abrir.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Abrir turno" />

            <div className="flex justify-center p-12">
                <div className="w-full max-w-sm border border-linea-fuerte bg-white p-8 shadow-alzada">
                    <h1 className="mb-5 font-display text-titulo font-bold text-tinta">
                        Abrir turno
                    </h1>
                    <form onSubmit={enviar} className="flex flex-col gap-5">
                        <Campo
                            etiqueta="Fondo de caja"
                            name="opening_amount"
                            inputMode="decimal"
                            autoFocus
                            value={form.data.opening_amount}
                            onChange={(e) => form.setData('opening_amount', e.target.value)}
                            error={form.errors.opening_amount}
                        />
                        <Boton type="submit" disabled={form.processing}>
                            Abrir turno
                        </Boton>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
