import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `bg-gray-800 hover:bg-gray-700 focus:bg-gray-700 focus:ring-indigo-500 active:bg-gray-900 dark:bg-gray-200 dark:text-gray-800 dark:focus:ring-offset-gray-800 dark:active:bg-gray-300 inline-flex items-center rounded-md border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:hover:bg-white dark:focus:bg-white ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
