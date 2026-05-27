import { lazy } from 'react';
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from 'react-router-dom';

import { AuthRoute } from './AuthRoute';
import { ProtectedRoute } from './ProtectedRoute';

const Index = lazy(() => import('pages/index'));
const Home = lazy(() => import('pages/home'));
const Game = lazy(() => import('pages/game'));

export const mainRouter = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/">
            <Route index element={<Index />} />
            <Route path="auth" element={<AuthRoute />} />
            <Route
                path="home"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />
            <Route
                path="game"
                element={
                    <ProtectedRoute>
                        <Game />
                    </ProtectedRoute>
                }
            />
        </Route>
    )
);
