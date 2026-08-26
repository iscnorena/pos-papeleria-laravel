import { Link, InertiaLinkProps } from '@inertiajs/react';

type EnlaceNavProps = InertiaLinkProps & {
    activo?: boolean;
};

export default function EnlaceNav({ activo = false, className = '', ...props }: EnlaceNavProps) {
    return (
        <Link
            {...props}
            className={`font-mono text-fino ${
                activo
                    ? 'bg-boligrafo font-semibold text-white'
                    : 'text-grafito hover:bg-papel-hondo hover:text-tinta'
            } block px-5 py-2.5 no-underline ${className}`}
        />
    );
}
