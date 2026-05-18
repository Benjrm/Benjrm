// src/routes.tsx

import type { RouteObject } from "react-router"
import LandingPage from "./pages/LandingPage"
import Dashboard from "./pages/Dashboard"
import ErrorPage from "./pages/ErrorPage"
import RootLayout from "./layouts/RootLayout"
import PublicLayout from "./layouts/PublicLayout"
import QuizCreatorPage from "./pages/QuizCreator.tsx"
import QuizPage from "./pages/QuizPage.tsx"

const routes: RouteObject[] = [
    {
        element: <PublicLayout />,
        children: [
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
        ],
    },
    {
        element: <RootLayout />,
        children: [
            {
                path: "/dashboard",
                element: <Dashboard />,
            },
            {
                path: "/createQuiz",
                element: <QuizCreatorPage />,
            },
            {
                path: "/quizDiscovery",
                element: <QuizPage />,
            },
        ],
    },
]

export default routes
