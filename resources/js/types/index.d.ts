export type Rol = 'admin' | 'cajera';

export interface User {
    id: number;
    name: string;
    username: string;
    email: string | null;
    role: Rol;
    branch_id: number;
    is_active: boolean;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
    };
    pos: {
        nombreNegocio: string;
    };
};
