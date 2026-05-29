import type { Store } from './store';

let storeRegistry: Store;
export const register = (store: Store) => {
    if (!storeRegistry) {
        storeRegistry = store;
    }
};

export const getState = () => {
    return storeRegistry.getState();
};
