// src/routes.tsx

import type { RouteObject } from "react-router"
import LandingPage from "./pages/LandingPage"
import Dashboard from "./pages/Dashboard"
import ErrorPage from "./pages/ErrorPage"
import RootLayout from "./layouts/RootLayout"
import PublicLayout from "./layouts/PublicLayout"
import ImprintPage from "./pages/ImprintPage"
import QuizCreator from "./pages/QuizCreator"
import Quizzes from "./pages/Quizzes"
import Lobby from "./pages/Lobby"
import InfoSlide from "./pages/InfoSlide"
import LoginRedirect from "@/auth/utils/LoginRedirect.tsx"
import AuthGuard from "@/auth/guards/AuthGuard.tsx"
import SingleChoiceQuestion from "@/pages/SingleChoiceQuestion.tsx"

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
                path: "/auth/login",
                element: <LoginRedirect />,
            },
            {
                path: "/lobby",
                element: <Lobby />,
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
                    {
                        path: "play",
                        element: <SingleChoiceQuestion />,
                    },
                ],
            },
            {
                path: "/quizzes",
                element: <Quizzes />,
            },
            {
                path: "/infoslide",
                element: <InfoSlide />,
            },
        ],
    },
]

export default routes
