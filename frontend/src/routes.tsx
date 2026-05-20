// src/routes.tsx

import type { RouteObject } from "react-router"
import LandingPage from "./pages/LandingPage"
import Dashboard from "./pages/Dashboard"
import ErrorPage from "./pages/ErrorPage"
import RootLayout from "./layouts/RootLayout"
import PublicLayout from "./layouts/PublicLayout"
import LoginRedirect from "@/auth/utils/LoginRedirect.tsx"
import AuthGuard from "@/auth/guards/AuthGuard.tsx"

const routes: RouteObject[] = [
    {
        element: <PublicLayout />,
        children: [
            // put public routes within this array
            {
                path: "/",
                element: <LandingPage />,
            },
            {
                path: "*",
                element: (
                    <ErrorPage message="The page you are looking for does not exist." title="404" />
                ),
            },
            {
                path: "/auth/login",
                element: <LoginRedirect />,
            },
        ],
    },
    {
        element: (
            <AuthGuard>
                <RootLayout />
            </AuthGuard>
        ),
        children: [
            // put protected routes within this array.
            {
                path: "/dashboard",
                element: <Dashboard />,
            },
        ],
    },
]

export default routes
