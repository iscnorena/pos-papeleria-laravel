import Boton from '@/Components/ui/Boton';
import Campo from '@/Components/ui/Campo';
import { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

const LARGO_MAXIMO_PIN = 6;
const LARGO_MINIMO_PIN = 4;

type Pestana = 'password' | 'pin';

export default function Login() {
    const { pos } = usePage<PageProps>().props;
    const [pestana, setPestana] = useState<Pestana>('password');

    const formPassword = useForm({ username: '', password: '' });
    const formPin = useForm({ pin: '' });

    const enviarPassword: FormEventHandler = (e) => {
        e.preventDefault();
        formPassword.post(route('login'), {
            onFinish: () => formPassword.reset('password'),
        });
    };

    const enviarPin = () => {
        if (formPin.data.pin.length < LARGO_MINIMO_PIN || formPin.processing) {
            return;
        }
        formPin.post(route('login.pin'), {
            onFinish: () => formPin.reset('pin'),
        });
    };

    const agregarDigito = (digito: string) => {
        if (formPin.data.pin.length >= LARGO_MAXIMO_PIN) {
            return;
        }
        formPin.clearErrors('pin');
        formPin.setData('pin', formPin.data.pin + digito);
    };

    const borrarDigito = () => {
        formPin.setData('pin', formPin.data.pin.slice(0, -1));
    };

    useEffect(() => {
        if (pestana !== 'pin') {
            return;
        }

        const alPresionarTecla = (evento: KeyboardEvent) => {
            if (/^[0-9]$/.test(evento.key)) {
                agregarDigito(evento.key);
            } else if (evento.key === 'Backspace') {
                borrarDigito();
            } else if (evento.key === 'Enter') {
                enviarPin();
            }
        };

        window.addEventListener('keydown', alPresionarTecla);
        return () => window.removeEventListener('keydown', alPresionarTecla);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pestana, formPin.data.pin, formPin.processing]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-papel p-12">
            <Head title="Entrar" />

            <div className="w-full max-w-sm">
                <h1 className="mb-7 text-center font-display text-titulo font-bold text-tinta">
                    {pos.nombreNegocio}
                </h1>

                <div className="flex">
                    <button
                        type="button"
                        onClick={() => setPestana('password')}
                        className={`flex-1 rounded-t border border-b-0 py-2.5 text-center font-mono text-micro uppercase ${
                            pestana === 'password'
                                ? 'border-linea-fuerte bg-white font-semibold text-tinta'
                                : 'border-linea bg-papel-hondo text-grafito'
                        }`}
                    >
                        Usuario y contraseña
                    </button>
                    <button
                        type="button"
                        onClick={() => setPestana('pin')}
                        className={`-ml-px flex-1 rounded-t border border-b-0 py-2.5 text-center font-mono text-micro uppercase ${
                            pestana === 'pin'
                                ? 'border-linea-fuerte bg-white font-semibold text-tinta'
                                : 'border-linea bg-papel-hondo text-grafito'
                        }`}
                    >
                        PIN
                    </button>
                </div>

                <div className="border border-linea-fuerte bg-white p-7 shadow-alzada">
                    {pestana === 'password' ? (
                        <form onSubmit={enviarPassword} className="flex flex-col gap-4">
                            <Campo
                                etiqueta="Usuario"
                                name="username"
                                autoComplete="username"
                                autoFocus
                                value={formPassword.data.username}
                                onChange={(e) => formPassword.setData('username', e.target.value)}
                                error={formPassword.errors.username}
                            />
                            <Campo
                                etiqueta="Contraseña"
                                type="password"
                                name="password"
                                autoComplete="current-password"
                                value={formPassword.data.password}
                                onChange={(e) => formPassword.setData('password', e.target.value)}
                                error={formPassword.errors.password}
                            />
                            <Boton type="submit" disabled={formPassword.processing}>
                                Entrar
                            </Boton>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center gap-5">
                            <div className="flex gap-2.5">
                                {Array.from({
                                    length: Math.max(formPin.data.pin.length, LARGO_MINIMO_PIN),
                                }).map((_, indice) => (
                                    <div
                                        key={indice}
                                        className={`h-4 w-4 rounded-sm border-2 ${
                                            indice < formPin.data.pin.length
                                                ? 'border-tinta bg-tinta'
                                                : 'border-linea-fuerte bg-white'
                                        }`}
                                    />
                                ))}
                            </div>

                            {formPin.errors.pin && (
                                <p role="alert" className="text-fino text-sello">
                                    {formPin.errors.pin}
                                </p>
                            )}

                            <div className="grid w-full grid-cols-3 gap-2.5">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digito) => (
                                    <button
                                        key={digito}
                                        type="button"
                                        onClick={() => agregarDigito(digito)}
                                        className="h-tecla rounded border border-linea-fuerte bg-white font-mono text-cuerpo text-tinta hover:bg-papel-hondo"
                                    >
                                        {digito}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={borrarDigito}
                                    className="h-tecla rounded border border-linea-fuerte bg-white font-mono text-fino text-grafito hover:bg-papel-hondo"
                                >
                                    Borrar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => agregarDigito('0')}
                                    className="h-tecla rounded border border-linea-fuerte bg-white font-mono text-cuerpo text-tinta hover:bg-papel-hondo"
                                >
                                    0
                                </button>
                                <button
                                    type="button"
                                    onClick={enviarPin}
                                    disabled={
                                        formPin.processing ||
                                        formPin.data.pin.length < LARGO_MINIMO_PIN
                                    }
                                    className="h-tecla rounded border-0 bg-boligrafo font-mono text-fino text-white hover:bg-boligrafo-hondo disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Entrar
                                </button>
                            </div>

                            <p className="font-mono text-micro text-grafito">
                                Teclea el PIN o usa el teclado
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
