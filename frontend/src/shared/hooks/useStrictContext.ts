import type { Context } from 'react';
import { createContext, useContext } from 'react';

export const useStrictContext = <T>(context: Context<T | null>) => {
    const value = useContext(context);
    if (value === null) {
        throw new Error('Strict context not passed');
    }
    return value as T;
};

export const createStrictContext = <T>() => createContext<T | null>(null);
