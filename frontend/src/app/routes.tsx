import type { RouteObject } from "react-router"
import { lazy } from "react"
import RootLayout from "./layout/RootLayout"
import LoginRedirect from "@/auth/utils/LoginRedirect.tsx"
import AuthGuard from "@/auth/guards/AuthGuard.tsx"

const LandingPage = lazy(async () => import("./pages/LandingPage"))
const DownloadableMarkdown = lazy(
    async () => import("@/shared/views/markdown/DownloadableMarkdown.tsx")
)
const ErrorPage = lazy(async () => import("./pages/ErrorPage"))
const GamePage = lazy(async () => import("./pages/GamePage"))
const HostDashboard = lazy(async () => import("./pages/HostDashboard"))
const Dashboard = lazy(async () => import("./pages/Dashboard"))
const QuizCreator = lazy(async () => import("./pages/QuizCreator"))
const Quizzes = lazy(async () => import("./pages/Quizzes"))

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
