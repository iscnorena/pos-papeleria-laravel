import { HTMLAttributes } from 'react';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p {...props} className={'text-red-600 dark:text-red-400 text-sm ' + className}>
            {message}
        </p>
    ) : null;
}
