import type { ReactNode } from "react"
import { NavLink } from "react-router"

export default function LoginLink(): ReactNode {
    return (
        <NavLink
            className="inline-block cursor-pointer rounded-lg bg-black p-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            to="/auth/login"
        >
            SIGN IN
        </NavLink>
    )
}
