// src/routes.tsx

import type { RouteObject } from 'react-router';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ErrorPage from './pages/ErrorPage';
import RootLayout from './layouts/RootLayout';
import PublicLayout from './layouts/PublicLayout';

export const routes: RouteObject[] = [
    // PUBLIC ROUTES: Wrapped in the minimal layout
    {
        element: <PublicLayout />,
        children: [
            {
                path: "/",
                element: <LandingPage />
            },
            {
                path: "*",
                element: <ErrorPage title="404" message="The page you are looking for does not exist." />
            }
        ]
    },
    // PRIVATE ROUTES: Wrapped in the authenticated layout
    {
        element: <RootLayout />,
            children: [
            {
                path: "/dashboard",
                element: <Dashboard />
            }
        ]
    }
];
