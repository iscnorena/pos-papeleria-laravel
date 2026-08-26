export interface ProductoPOS {
    id: number;
    name: string;
    code: string | null;
    category_id: number | null;
    sale_price_cents: number;
    manages_inventory: boolean;
    stock: number | null;
}

export interface RenglonCarrito {
    productId: number;
    name: string;
    code: string | null;
    unitPriceCents: number;
    quantity: number;
    discountCents: number;
    managesInventory: boolean;
    stock: number | null;
}

export interface EstadoCarrito {
    renglones: RenglonCarrito[];
    activoId: number | null;
    descuentoGeneralCents: number;
}

export type AccionCarrito =
    | { type: 'agregar'; producto: ProductoPOS }
    | { type: 'ajustar_cantidad'; productId: number; delta: number }
    | { type: 'fijar_cantidad'; productId: number; quantity: number }
    | { type: 'quitar'; productId: number }
    | { type: 'fijar_descuento'; productId: number; discountCents: number }
    | { type: 'fijar_activo'; productId: number | null }
    | { type: 'fijar_descuento_general'; discountCents: number }
    | { type: 'limpiar' };

export const estadoInicialCarrito: EstadoCarrito = {
    renglones: [],
    activoId: null,
    descuentoGeneralCents: 0,
};

export function carritoReducer(estado: EstadoCarrito, accion: AccionCarrito): EstadoCarrito {
    switch (accion.type) {
        case 'agregar': {
            const existente = estado.renglones.find((r) => r.productId === accion.producto.id);

            if (existente) {
                return {
                    ...estado,
                    activoId: accion.producto.id,
                    renglones: estado.renglones.map((r) =>
                        r.productId === accion.producto.id ? { ...r, quantity: r.quantity + 1 } : r,
                    ),
                };
            }

            return {
                ...estado,
                activoId: accion.producto.id,
                renglones: [
                    ...estado.renglones,
                    {
                        productId: accion.producto.id,
                        name: accion.producto.name,
                        code: accion.producto.code,
                        unitPriceCents: accion.producto.sale_price_cents,
                        quantity: 1,
                        discountCents: 0,
                        managesInventory: accion.producto.manages_inventory,
                        stock: accion.producto.stock,
                    },
                ],
            };
        }
        case 'ajustar_cantidad':
            return {
                ...estado,
                renglones: estado.renglones
                    .map((r) =>
                        r.productId === accion.productId
                            ? { ...r, quantity: r.quantity + accion.delta }
                            : r,
                    )
                    .filter((r) => r.quantity > 0),
            };
        case 'fijar_cantidad':
            return {
                ...estado,
                renglones: estado.renglones.map((r) =>
                    r.productId === accion.productId
                        ? { ...r, quantity: Math.max(1, Math.floor(accion.quantity) || 1) }
                        : r,
                ),
            };
        case 'quitar':
            return {
                ...estado,
                renglones: estado.renglones.filter((r) => r.productId !== accion.productId),
                activoId: estado.activoId === accion.productId ? null : estado.activoId,
            };
        case 'fijar_descuento':
            return {
                ...estado,
                renglones: estado.renglones.map((r) =>
                    r.productId === accion.productId
                        ? { ...r, discountCents: Math.max(0, accion.discountCents) }
                        : r,
                ),
            };
        case 'fijar_activo':
            return { ...estado, activoId: accion.productId };
        case 'fijar_descuento_general':
            return { ...estado, descuentoGeneralCents: Math.max(0, accion.discountCents) };
        case 'limpiar':
            return estadoInicialCarrito;
        default:
            return estado;
    }
}

export function calcularTotales(
    renglones: RenglonCarrito[],
    descuentoGeneralCents: number,
    tasaImpuestoBps: number,
) {
    const subtotalCents = renglones.reduce(
        (suma, r) => suma + r.unitPriceCents * r.quantity - r.discountCents,
        0,
    );
    const taxCents = Math.round((subtotalCents * tasaImpuestoBps) / 10000);
    const totalCents = Math.max(0, subtotalCents + taxCents - descuentoGeneralCents);

    return { subtotalCents, taxCents, totalCents };
}
