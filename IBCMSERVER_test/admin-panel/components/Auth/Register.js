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
    Stepper,
    Step,
    StepLabel,
    FormControlLabel,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const { register, setup2FA } = useAuth();
    const navigate = useNavigate();

    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        enable2FA: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [show2FADialog, setShow2FADialog] = useState(false);

    const steps = ['Personal Information', 'Account Security', 'Review'];

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'enable2FA' ? checked : value
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

    const handleNext = () => {
        if (activeStep === 1 && !validateForm()) {
            return;
        }
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const setup2FAHandler = async () => {
        try {
            const response = await setup2FA();
            setQrCode(response.qrCode);
            setShow2FADialog(true);
        } catch (error) {
            setError(error.message);
        }
    };

    const verify2FAHandler = async () => {
        try {
            await setup2FA(verificationCode);
            setShow2FADialog(false);
            handleNext();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                has2FA: formData.enable2FA
            });
            navigate('/login');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </Stack>
                );
            case 1:
                return (
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
                            helperText="Password must be at least 8 characters long"
                        />
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.enable2FA}
                                    onChange={handleChange}
                                    name="enable2FA"
                                />
                            }
                            label="Enable Two-Factor Authentication"
                        />
                    </Stack>
                );
            case 2:
                return (
                    <Stack spacing={2}>
                        <Typography variant="subtitle1">
                            Please review your information:
                        </Typography>
                        <Typography>
                            Name: {formData.firstName} {formData.lastName}
                        </Typography>
                        <Typography>
                            Email: {formData.email}
                        </Typography>
                        <Typography>
                            Two-Factor Authentication: {formData.enable2FA ? 'Enabled' : 'Disabled'}
                        </Typography>
                    </Stack>
                );
            default:
                return null;
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
            <Card sx={{ width: 600, boxShadow: 3 }}>
                <CardContent>
                    <Stack spacing={3}>
                        <Typography variant="h5" align="center">
                            Admin Registration
                        </Typography>

                        {error && (
                            <Alert severity="error">{error}</Alert>
                        )}

                        <Stepper activeStep={activeStep}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                {renderStepContent(activeStep)}

                                <Stack direction="row" spacing={2} justifyContent="space-between">
                                    <Button
                                        onClick={handleBack}
                                        disabled={activeStep === 0}
                                    >
                                        Back
                                    </Button>
                                    {activeStep === steps.length - 1 ? (
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={loading}
                                        >
                                            {loading ? 'Registering...' : 'Register'}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            onClick={activeStep === 1 && formData.enable2FA ? setup2FAHandler : handleNext}
                                        >
                                            Next
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </form>
                    </Stack>
                </CardContent>
            </Card>

            {/* 2FA Setup Dialog */}
            <Dialog open={show2FADialog} onClose={() => setShow2FADialog(false)}>
                <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <Typography>
                            Scan the QR code with your authenticator app
                        </Typography>
                        <Box
                            component="img"
                            src={qrCode}
                            alt="2FA QR Code"
                            sx={{ width: 200, height: 200, margin: 'auto' }}
                        />
                        <TextField
                            fullWidth
                            label="Verification Code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShow2FADialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={verify2FAHandler}
                        variant="contained"
                        disabled={!verificationCode}
                    >
                        Verify
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Register; 