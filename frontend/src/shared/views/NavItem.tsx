import type { JSX } from "react"
import { NavLink } from "react-router"

interface NavItemProps {
    to: string
    children: React.ReactNode
    onClick?: () => void
    isMobile?: boolean
}

export default function NavItem({
    to,
    children,
    onClick,
    isMobile = false,
}: NavItemProps): JSX.Element {
    const textSize = isMobile ? "text-base" : "text-sm"

    return (
        <NavLink
            end
            onClick={onClick}
            to={to}
            className={({ isActive }) =>
                isActive
                    ? `font-bold text-[#00F2FF] ${textSize} transition-colors`
                    : `text-muted-foreground hover:text-foreground font-medium ${textSize} transition-colors`
            }
        >
            {children}
        </NavLink>
    )
}

NavItem.defaultProps = {
    onClick: undefined,
    isMobile: false,
}
