import type { RouteObject } from "react-router"
import LandingPage from "./pages/LandingPage"
import Dashboard from "./pages/Dashboard"
import ErrorPage from "./pages/ErrorPage"
import RootLayout from "./layout/RootLayout"
import QuizCreator from "./pages/QuizCreator"
import DownloadableMarkdown from "@/shared/views/markdown/DownloadableMarkdown.tsx"
import LoginRedirect from "@/auth/utils/LoginRedirect.tsx"
import AuthGuard from "@/auth/guards/AuthGuard.tsx"
import Quizzes from "@/app/pages/Quizzes.tsx"
import GamePage from "@/app/pages/GamePage.tsx"
import HostDashboard from "@/app/pages/HostDashboard.tsx"

const routes: RouteObject[] = [
    {
        element: <RootLayout />,
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
                    { index: true, element: <GamePage /> },
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
        ],
    },
]

export default routes
