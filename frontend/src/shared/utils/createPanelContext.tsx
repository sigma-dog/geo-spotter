import type { Dispatch, FC, ReactNode, SetStateAction } from 'react';
import { useState } from 'react';

import { createStrictContext, useStrictContext } from 'shared/hooks';
import type { TypeOrNull } from 'shared/types';

type ContextProviderProps<T extends object> = {
    children: ReactNode;
    renderPanel: (props: T) => ReactNode;
};

export const createPanelContext = <T extends object>(): [
    FC<ContextProviderProps<T>>,
    () => Dispatch<SetStateAction<TypeOrNull<T>>>,
] => {
    const Context =
        createStrictContext<Dispatch<SetStateAction<TypeOrNull<T>>>>();

    const usePanelContext = () => useStrictContext(Context);

    const ContextProvider: FC<ContextProviderProps<T>> = ({
        children,
        renderPanel,
    }) => {
        const [panelProps, setPanelProps] = useState<TypeOrNull<T>>(null);

        return (
            <Context.Provider value={setPanelProps}>
                {children}
                {panelProps && renderPanel(panelProps)}
            </Context.Provider>
        );
    };

    return [ContextProvider, usePanelContext];
};
