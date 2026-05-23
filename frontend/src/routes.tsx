// src/routes.tsx

import type { RouteObject } from "react-router"
import LandingPage from "./pages/LandingPage"
import Dashboard from "./pages/Dashboard"
import ErrorPage from "./pages/ErrorPage"
import RootLayout from "./layouts/RootLayout"
import PublicLayout from "./layouts/PublicLayout"
import ImprintPage from "./pages/ImprintPage"
import QuizCreator from "./pages/QuizCreator.tsx"
import LoginRedirect from "@/auth/utils/LoginRedirect.tsx"
import AuthGuard from "@/auth/guards/AuthGuard.tsx"
import Leaderboard from "@/quiz/leaderboard/components/Leaderboard.tsx"

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
                path: "/imprint",
                element: <ImprintPage />,
            },
            {
                path: "*",
                element: (
                    <ErrorPage message="The page you are looking for does not exist." title="404" />
                ),
            },
            {
                path: "/leaderboard",
                element: <Leaderboard />,
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
            {
                path: "/quiz",
                children: [
                    {
                        path: "new", // Maps to /quiz/new
                        element: <QuizCreator />,
                    },
                    {
                        path: ":quizId",
                        element: <QuizCreator />,
                    },
                ],
            },
        ],
    },
]

export default routes
