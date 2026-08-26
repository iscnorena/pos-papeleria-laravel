import Distintivo from '@/Components/ui/Distintivo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { centavosAPesos, formatearPesos, pesosACentavos } from '@/lib/money';
import { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import CobroModal from './CobroModal';
import { ProductoPOS, calcularTotales, carritoReducer, estadoInicialCarrito } from './carrito';

interface Categoria {
    id: number;
    name: string;
}

function elementoEsEditable(elemento: Element | null): boolean {
    if (!elemento) return false;
    const etiqueta = elemento.tagName;
    return etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT';
}

export default function Index({
    products,
    categories,
}: {
    products: ProductoPOS[];
    categories: Categoria[];
}) {
    const { pos } = usePage<PageProps>().props;
    const [carrito, dispatch] = useReducer(carritoReducer, estadoInicialCarrito);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaId, setCategoriaId] = useState<number | null>(null);
    const [cobroAbierto, setCobroAbierto] = useState(false);
    const [aperturaCobro, setAperturaCobro] = useState(0);
    const [procesando, setProcesando] = useState(false);

    const abrirCobro = () => {
        setCobroAbierto(true);
        setAperturaCobro((n) => n + 1);
    };
    const buscadorRef = useRef<HTMLInputElement>(null);

    const productosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return products.filter((producto) => {
            const coincideCategoria = categoriaId === null || producto.category_id === categoriaId;
            const coincideTermino =
                termino === '' ||
                producto.name.toLowerCase().includes(termino) ||
                producto.code?.toLowerCase().includes(termino);

            return coincideCategoria && coincideTermino;
        });
    }, [products, busqueda, categoriaId]);

    const { subtotalCents, totalCents } = calcularTotales(
        carrito.renglones,
        carrito.descuentoGeneralCents,
        pos.tasaImpuestoBps,
    );

    useEffect(() => {
        const alPresionarTecla = (evento: KeyboardEvent) => {
            const activo = document.activeElement;

            if (evento.key === 'F2') {
                evento.preventDefault();
                buscadorRef.current?.focus();
                return;
            }

            if (evento.key === 'F12') {
                evento.preventDefault();
                if (carrito.renglones.length > 0) abrirCobro();
                return;
            }

            if (evento.key === 'Enter' && activo === buscadorRef.current) {
                evento.preventDefault();
                if (productosFiltrados[0]) {
                    dispatch({ type: 'agregar', producto: productosFiltrados[0] });
                    // Suelta el foco del buscador: si no, +/- y Supr escribirían en el
                    // campo de texto en vez de ajustar el renglón activo.
                    buscadorRef.current?.blur();
                }
                return;
            }

            if (elementoEsEditable(activo)) return;

            if ((evento.key === '+' || evento.key === '-') && carrito.activoId !== null) {
                dispatch({
                    type: 'ajustar_cantidad',
                    productId: carrito.activoId,
                    delta: evento.key === '+' ? 1 : -1,
                });
            }

            if (evento.key === 'Delete' && carrito.activoId !== null) {
                dispatch({ type: 'quitar', productId: carrito.activoId });
            }
        };

        window.addEventListener('keydown', alPresionarTecla);
        return () => window.removeEventListener('keydown', alPresionarTecla);
    }, [productosFiltrados, carrito.activoId, carrito.renglones.length]);

    const confirmarCobro = (pagos: { method: string; amountCents: number }[]) => {
        setProcesando(true);
        router.post(
            route('pos.store'),
            {
                items: carrito.renglones.map((r) => ({
                    product_id: r.productId,
                    quantity: r.quantity,
                    discount_cents: r.discountCents,
                })),
                discount_cents: carrito.descuentoGeneralCents,
                payments: pagos.map((p) => ({ method: p.method, amount_cents: p.amountCents })),
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setProcesando(false),
                onSuccess: () => {
                    dispatch({ type: 'limpiar' });
                    setCobroAbierto(false);
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Punto de venta" />

            <div className="flex h-[calc(100vh-57px)]">
                <div className="flex min-w-0 flex-1 flex-col p-5">
                    <input
                        ref={buscadorRef}
                        aria-label="Buscar por nombre o código"
                        placeholder="Buscar por nombre o código (F2)"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="mb-3 h-11 rounded border border-linea-fuerte bg-white px-3 text-base text-tinta focus:border-boligrafo focus:outline-none focus:ring-1 focus:ring-boligrafo"
                    />

                    <div className="mb-4 flex flex-wrap gap-2">
                        <button
                            onClick={() => setCategoriaId(null)}
                            className={`rounded px-3 py-1.5 font-mono text-micro uppercase ${
                                categoriaId === null
                                    ? 'bg-boligrafo text-white'
                                    : 'border border-linea-fuerte bg-white text-grafito'
                            }`}
                        >
                            Todas
                        </button>
                        {categories.map((categoria) => (
                            <button
                                key={categoria.id}
                                onClick={() => setCategoriaId(categoria.id)}
                                className={`rounded px-3 py-1.5 font-mono text-micro uppercase ${
                                    categoriaId === categoria.id
                                        ? 'bg-boligrafo text-white'
                                        : 'border border-linea-fuerte bg-white text-grafito'
                                }`}
                            >
                                {categoria.name}
                            </button>
                        ))}
                    </div>

                    <div className="grid flex-1 auto-rows-min grid-cols-3 gap-3 overflow-y-auto pb-3">
                        {productosFiltrados.map((producto) => {
                            const sinStock =
                                producto.manages_inventory &&
                                (producto.stock === null || producto.stock <= 0);

                            return (
                                <button
                                    key={producto.id}
                                    onClick={() => dispatch({ type: 'agregar', producto })}
                                    className={`flex flex-col gap-1.5 border border-linea-fuerte bg-white p-3.5 text-left ${sinStock ? 'opacity-55' : ''}`}
                                >
                                    <span className="text-base font-semibold leading-tight text-tinta">
                                        {producto.name}
                                    </span>
                                    {producto.code && (
                                        <span className="font-mono text-fino text-grafito">
                                            {producto.code}
                                        </span>
                                    )}
                                    <div className="mt-1 flex items-baseline justify-between">
                                        <span className="font-display text-cuerpo font-bold text-tinta">
                                            {formatearPesos(producto.sale_price_cents)}
                                        </span>
                                        {producto.manages_inventory &&
                                            (sinStock ? (
                                                <Distintivo tono="sello">Sin stock</Distintivo>
                                            ) : (
                                                <span className="font-mono text-fino text-visto">
                                                    {producto.stock} pza
                                                </span>
                                            ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-2 border-t border-linea pt-2 font-mono text-micro text-grafito">
                        F2 Buscar · Enter Agregar · +/− Cantidad · Supr Quitar · F12 Cobrar · Esc
                        Cerrar
                    </div>
                </div>

                <div className="flex w-cinta shrink-0 flex-col border-l border-linea-fuerte bg-white shadow-cinta">
                    <div className="border-b border-linea px-5 py-4">
                        <h1 className="font-display text-cuerpo font-bold text-tinta">Venta</h1>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {carrito.renglones.length === 0 && (
                            <p className="p-5 text-center font-mono text-fino text-grafito">
                                El carrito está vacío.
                            </p>
                        )}
                        {carrito.renglones.map((renglon) => (
                            <div
                                key={renglon.productId}
                                onClick={() =>
                                    dispatch({ type: 'fijar_activo', productId: renglon.productId })
                                }
                                className={`flex cursor-pointer flex-col gap-1.5 border-b border-linea px-5 py-3 ${
                                    carrito.activoId === renglon.productId
                                        ? 'bg-marcador-tenue'
                                        : ''
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-base font-semibold text-tinta">
                                        {renglon.name}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch({
                                                type: 'quitar',
                                                productId: renglon.productId,
                                            });
                                        }}
                                        aria-label={`Quitar ${renglon.name}`}
                                        className="font-mono text-fino text-sello"
                                    >
                                        Quitar
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-mono text-base">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dispatch({
                                                    type: 'ajustar_cantidad',
                                                    productId: renglon.productId,
                                                    delta: -1,
                                                });
                                            }}
                                            aria-label="Restar uno"
                                            className="h-6 w-6 border border-linea-fuerte bg-white"
                                        >
                                            −
                                        </button>
                                        <span>{renglon.quantity}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dispatch({
                                                    type: 'ajustar_cantidad',
                                                    productId: renglon.productId,
                                                    delta: 1,
                                                });
                                            }}
                                            aria-label="Sumar uno"
                                            className="h-6 w-6 border border-linea-fuerte bg-white"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="font-mono text-base font-semibold text-tinta">
                                        {formatearPesos(
                                            renglon.unitPriceCents * renglon.quantity -
                                                renglon.discountCents,
                                        )}
                                    </span>
                                </div>
                                <label
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 font-mono text-fino text-grafito"
                                >
                                    Desc.
                                    <input
                                        aria-label={`Descuento de ${renglon.name}`}
                                        inputMode="decimal"
                                        defaultValue={centavosAPesos(renglon.discountCents)}
                                        onBlur={(e) => {
                                            const centavos = pesosACentavos(e.target.value) ?? 0;
                                            dispatch({
                                                type: 'fijar_descuento',
                                                productId: renglon.productId,
                                                discountCents: centavos,
                                            });
                                        }}
                                        className="h-6 w-16 rounded border border-linea-fuerte px-1.5 text-fino"
                                    />
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 border-t border-linea-fuerte px-5 py-4">
                        <div className="flex justify-between font-mono text-fino text-grafito">
                            <span>Subtotal</span>
                            <span>{formatearPesos(subtotalCents)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-marcador-tenue px-3 py-3">
                            <span className="font-display text-fino font-bold uppercase text-tinta">
                                Total
                            </span>
                            <span className="font-display text-total font-bold leading-none text-tinta">
                                {formatearPesos(totalCents)}
                            </span>
                        </div>
                        <button
                            onClick={abrirCobro}
                            disabled={carrito.renglones.length === 0}
                            className="h-tecla rounded bg-boligrafo font-mono text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cobrar (F12)
                        </button>
                    </div>
                </div>
            </div>

            <CobroModal
                key={aperturaCobro}
                abierto={cobroAbierto}
                onCerrar={() => setCobroAbierto(false)}
                totalCents={totalCents}
                metodosPago={pos.metodosPago}
                onConfirmar={confirmarCobro}
                procesando={procesando}
            />
        </AuthenticatedLayout>
    );
}
