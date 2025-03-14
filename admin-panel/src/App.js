import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import MainLayout from './components/Layout/MainLayout';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <MainLayout>
                {/* Additional routes and components will be rendered here */}
            </MainLayout>
        </ThemeProvider>
    );
}

export default App;