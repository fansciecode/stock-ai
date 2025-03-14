import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import theme from './theme';
import AppRoutes from './Routes';

const App = () => {
    return (
        <BrowserRouter>
            <ThemeProvider theme={theme}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <SnackbarProvider 
                        maxSnack={3} 
                        anchorOrigin={{ 
                            vertical: 'top', 
                            horizontal: 'right' 
                        }}
                    >
                        <AuthProvider>
                            <CssBaseline />
                            <AppRoutes />
                        </AuthProvider>
                    </SnackbarProvider>
                </LocalizationProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
};

export default App;
