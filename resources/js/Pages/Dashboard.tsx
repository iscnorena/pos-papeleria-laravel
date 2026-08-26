import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Tablero" />

            <div className="p-6 text-cuerpo text-tinta">Sesión iniciada.</div>
        </AuthenticatedLayout>
    );
}
