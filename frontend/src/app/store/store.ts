import { configureStore } from '@reduxjs/toolkit';

import { api } from 'shared/api/api';

import { reducers } from './reducers';
import { register } from './storeRegistry';

export const store = configureStore({
    reducer: { ...reducers, [api.reducerPath]: api.reducer },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
});

register(store);

export type AppDispatch = typeof store.dispatch;
export type Store = typeof store;
export type RootState = ReturnType<typeof store.getState>;
