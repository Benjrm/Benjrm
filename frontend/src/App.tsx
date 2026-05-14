import type { JSX } from 'react'
import { Button } from '@/shadcn/components/ui/button'

function App(): JSX.Element {
    return (
        <>
            <h1 className="text-red-600">
                Hello React + TypeScript + React Router + TanStack Query + TailwindCSS + shadcn/ui!
            </h1>
            <Button variant="default">Click me</Button>
        </>
    )
}

export default App
