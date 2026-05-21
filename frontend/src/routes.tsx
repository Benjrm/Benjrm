// src/routes.tsx

import type { RouteObject } from "react-router"
import LandingPage from "./pages/LandingPage"
import Dashboard from "./pages/Dashboard"
import ErrorPage from "./pages/ErrorPage"
import RootLayout from "./layouts/RootLayout"
import PublicLayout from "./layouts/PublicLayout"
import ImprintPage from "./pages/ImprintPage"
import QuizCreator from "./pages/QuizCreator.tsx"

const routes: RouteObject[] = [
    {
        element: <PublicLayout />,
        children: [
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
