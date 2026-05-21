import { lazy } from 'react';
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from 'react-router-dom';

const Index = lazy(() => import('pages/index'));
const Auth = lazy(() => import('pages/auth'));
const Home = lazy(() => import('pages/home'));
const Game = lazy(() => import('pages/game'));

export const mainRouter = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/">
            <Route index element={<Index />} />
            <Route path="auth" element={<Auth />} />
            <Route path="home" element={<Home />} />
            <Route path="game" element={<Game />} />
        </Route>
    )
);
