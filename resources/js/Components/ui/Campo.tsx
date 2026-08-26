import { InputHTMLAttributes, forwardRef } from 'react';

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
    etiqueta: string;
    error?: string;
};

const Campo = forwardRef<HTMLInputElement, CampoProps>(function Campo(
    { etiqueta, error, id, className = '', ...props },
    ref,
) {
    const inputId = id ?? props.name;

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="font-mono text-micro uppercase text-grafito">
                {etiqueta}
            </label>
            <input
                {...props}
                id={inputId}
                ref={ref}
                className={`h-11 rounded border px-3 text-base text-tinta focus:border-boligrafo focus:outline-none focus:ring-1 focus:ring-boligrafo ${
                    error ? 'border-sello' : 'border-linea-fuerte'
                } ${className}`}
            />
            {error && (
                <p role="alert" className="text-fino text-sello">
                    {error}
                </p>
            )}
        </div>
    );
});

export default Campo;
