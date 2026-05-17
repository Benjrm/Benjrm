// frontend/src/App.tsx

import { useRoutes } from 'react-router';
import { routes } from './routes';

function App() {
    const routing = useRoutes(routes);

    return (
        <>
            {routing}
        </>
    );
}

export default App;
