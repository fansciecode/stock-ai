import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Link
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
    const { login, forgotPassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(formData.email, formData.password);
            if (result.requires2FA) {
                setShowTwoFactor(true);
            } else {
                navigate(from);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTwoFactorSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            await login(formData.email, formData.password, twoFactorCode);
            navigate(from);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            await forgotPassword(forgotPasswordEmail);
            setSuccessMessage('Password reset instructions have been sent to your email');
            setShowForgotPassword(false);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

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
                            Admin Login
                        </Typography>

                        {error && (
                            <Alert severity="error">{error}</Alert>
                        )}

                        {successMessage && (
                            <Alert severity="success">{successMessage}</Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => setShowForgotPassword(true)}
                                    align="right"
                                >
                                    Forgot Password?
                                </Link>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                            </Stack>
                        </form>
                    </Stack>
                </CardContent>
            </Card>

            {/* 2FA Dialog */}
            <Dialog open={showTwoFactor} onClose={() => setShowTwoFactor(false)}>
                <DialogTitle>Two-Factor Authentication</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <Typography>
                            Please enter the verification code sent to your device
                        </Typography>
                        <TextField
                            fullWidth
                            label="Verification Code"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            required
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowTwoFactor(false)}>Cancel</Button>
                    <Button
                        onClick={handleTwoFactorSubmit}
                        variant="contained"
                        disabled={loading || !twoFactorCode}
                    >
                        Verify
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Forgot Password Dialog */}
            <Dialog 
                open={showForgotPassword} 
                onClose={() => setShowForgotPassword(false)}
            >
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <Typography>
                            Enter your email address to receive password reset instructions
                        </Typography>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            required
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowForgotPassword(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleForgotPasswordSubmit}
                        variant="contained"
                        disabled={loading || !forgotPasswordEmail}
                    >
                        Send Instructions
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Login; 