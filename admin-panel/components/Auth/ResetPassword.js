import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const ResetPassword = () => {
    const { resetPassword, validateResetToken } = useAuth();
    const navigate = useNavigate();
    const { token } = useParams();
    const location = useLocation();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validatingToken, setValidatingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
            try {
                await validateResetToken(token);
                setTokenValid(true);
            } catch (error) {
                setError('Invalid or expired reset token');
                setTokenValid(false);
            } finally {
                setValidatingToken(false);
            }
        };

        if (token) {
            validateToken();
        } else {
            setError('Reset token is missing');
            setValidatingToken(false);
        }
    }, [token, validateResetToken]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError('');
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            await resetPassword(token, formData.password);
            navigate('/login', { 
                state: { 
                    message: 'Password has been successfully reset. Please login with your new password.' 
                }
            });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (validatingToken) {
        return (
            <Box
                sx={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default'
            }}
        >
            <Card sx={{ width: 400, boxShadow: 3 }}>
                <CardContent>
                    <Stack spacing={3}>
                        <Typography variant="h5" align="center">
                            Reset Password
                        </Typography>

                        {error && (
                            <Alert severity="error">{error}</Alert>
                        )}

                        {location.state?.message && (
                            <Alert severity="info">{location.state.message}</Alert>
                        )}

                        {tokenValid ? (
                            <form onSubmit={handleSubmit}>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        helperText="Password must be at least 8 characters long"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Confirm New Password"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={loading}
                                    >
                                        {loading ? 'Resetting Password...' : 'Reset Password'}
                                    </Button>
                                </Stack>
                            </form>
                        ) : (
                            <Stack spacing={2}>
                                <Typography color="error" align="center">
                                    This password reset link is invalid or has expired.
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => navigate('/login')}
                                >
                                    Return to Login
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ResetPassword; 