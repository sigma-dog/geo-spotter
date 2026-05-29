import { createRoot } from 'react-dom/client';
import { Provider as StoreProvider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

import { mainRouter } from 'app/router/MainRoute';
import { store } from 'app/store/store';
import { AppChakraProvider } from 'shared/ui';
import { Toaster } from 'shared/ui/chakra/toaster';
import { AddFriendsPanelProvider } from 'widgets/addFriendsPanel';

import './css/index.scss';

createRoot(document.getElementById('root')!).render(
    // <StrictMode>
    <StoreProvider store={store}>
        <AppChakraProvider forcedTheme="light">
            <AddFriendsPanelProvider>
                <>
                    <RouterProvider router={mainRouter} />
                    <Toaster />
                </>
            </AddFriendsPanelProvider>
        </AppChakraProvider>
    </StoreProvider>
    // </StrictMode>
);
