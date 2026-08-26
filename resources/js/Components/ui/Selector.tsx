import { SelectHTMLAttributes, forwardRef, useId } from 'react';

type SelectorProps = SelectHTMLAttributes<HTMLSelectElement> & {
    etiqueta?: string;
    error?: string;
};

const Selector = forwardRef<HTMLSelectElement, SelectorProps>(function Selector(
    { etiqueta, error, id, className = '', children, ...props },
    ref,
) {
    const idGenerado = useId();
    const selectId = id ?? props.name ?? idGenerado;

    return (
        <div className="flex flex-col gap-1.5">
            {etiqueta && (
                <label htmlFor={selectId} className="font-mono text-micro uppercase text-grafito">
                    {etiqueta}
                </label>
            )}
            <select
                {...props}
                id={selectId}
                ref={ref}
                className={`h-11 rounded border bg-white px-3 text-base text-tinta focus:border-boligrafo focus:outline-none focus:ring-1 focus:ring-boligrafo ${
                    error ? 'border-sello' : 'border-linea-fuerte'
                } ${className}`}
            >
                {children}
            </select>
            {error && (
                <p role="alert" className="text-fino text-sello">
                    {error}
                </p>
            )}
        </div>
    );
});

export default Selector;
