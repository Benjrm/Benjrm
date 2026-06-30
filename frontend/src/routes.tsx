// src/routes.tsx

import type { RouteObject } from "react-router"
import LandingPage from "./pages/LandingPage"
import Dashboard from "./pages/Dashboard"
import ErrorPage from "./pages/ErrorPage"
import RootLayout from "./layouts/RootLayout"
import PublicLayout from "./layouts/PublicLayout"
import QuizCreator from "./pages/QuizCreator"
import OrderQuestion from "./pages/OrderQuestion"
import DownloadableMarkdown from "./components/DownloadableMarkdown"
import LoginRedirect from "@/auth/utils/LoginRedirect.tsx"
import AuthGuard from "@/auth/guards/AuthGuard.tsx"
import Quizzes from "@/pages/Quizzes.tsx"
import InfoSlide from "@/pages/InfoSlide.tsx"
import GamePage from "@/pages/GamePage.tsx"
import HostDashboard from "@/pages/HostDashboard.tsx"

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
                element: <DownloadableMarkdown displayName="Imprint" filename="imprint.md" />,
            },
            {
                path: "/privacy",
                element: (
                    <DownloadableMarkdown displayName="Privacy Policy" filename="privacy.md" />
                ),
            },
            {
                path: "*",
                element: <ErrorPage title="404" />,
            },
            {
                path: "/auth/login",
                element: <LoginRedirect />,
            },
            {
                path: "/play/:code",
                children: [
                    { path: "game", element: <GamePage /> },
                    { path: "host", element: <HostDashboard /> },
                ],
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
            {
                path: "/quizzes",
                element: <Quizzes />,
            },
            {
                path: "/quiz/order",
                element: <OrderQuestion />,
            },
            {
                path: "/infoslide",
                element: <InfoSlide />,
            },
        ],
    },
]

export default routes
