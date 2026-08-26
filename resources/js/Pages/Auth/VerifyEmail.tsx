import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                Thanks for signing up! Before getting started, could you verify your email address
                by clicking on the link we just emailed to you? If you didn&apos;t receive the
                email, we will gladly send you another.
            </div>

            {status === 'verification-link-sent' && (
                <div className="text-green-600 dark:text-green-400 mb-4 text-sm font-medium">
                    A new verification link has been sent to the email address you provided during
                    registration.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>Resend Verification Email</PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-gray-600 hover:text-gray-900 focus:ring-indigo-500 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800 rounded-md text-sm underline focus:outline-none focus:ring-2 focus:ring-offset-2"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
