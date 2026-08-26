export type Rol = 'admin' | 'cajera';
export type MetodoPago = 'cash' | 'card' | 'transfer';

export interface Branch {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
}

export interface User {
    id: number;
    name: string;
    username: string;
    email: string | null;
    role: Rol;
    branch_id: number;
    branch: Branch;
    is_active: boolean;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
    };
    pos: {
        nombreNegocio: string;
        simboloMoneda: string;
        metodosPago: Record<MetodoPago, string>;
        tasaImpuestoBps: number;
    };
    flash: {
        success: string | null;
        error: string | null;
    };
};
