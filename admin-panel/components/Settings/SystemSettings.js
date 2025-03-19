import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Switch,
    FormControlLabel,
    Divider,
    Alert,
    Snackbar,
    Stack,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Tab,
    Tabs,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [settings, setSettings] = useState({
        general: {
            platformName: '',
            supportEmail: '',
            maxFileSize: 5,
            defaultLanguage: 'en',
            maintenanceMode: false,
            allowUserRegistration: true
        },
        email: {
            smtpHost: '',
            smtpPort: '',
            smtpUser: '',
            smtpPassword: '',
            senderName: '',
            senderEmail: '',
            enableEmailNotifications: true
        },
        security: {
            passwordMinLength: 8,
            requireSpecialChars: true,
            requireNumbers: true,
            sessionTimeout: 30,
            maxLoginAttempts: 5,
            twoFactorAuth: false
        },
        integrations: {
            googleMapsApiKey: '',
            stripePublicKey: '',
            stripeSecretKey: '',
            enableGoogleAuth: false,
            enableFacebookAuth: false
        },
        notifications: {
            enablePushNotifications: true,
            enableEmailDigest: true,
            digestFrequency: 'daily',
            adminAlertEmail: ''
        }
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/settings');
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            showSnackbar('Error fetching settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleSettingChange = (category, setting, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [setting]: value
            }
        }));
    };

    const handleSave = async (category) => {
        try {
            const response = await fetch(`/api/admin/settings/${category}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings[category])
            });

            if (response.ok) {
                showSnackbar('Settings saved successfully', 'success');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            showSnackbar('Error saving settings', 'error');
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const renderGeneralSettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Platform Name"
                    value={settings.general.platformName}
                    onChange={(e) => handleSettingChange('general', 'platformName', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Support Email"
                    value={settings.general.supportEmail}
                    onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    type="number"
                    label="Max File Size (MB)"
                    value={settings.general.maxFileSize}
                    onChange={(e) => handleSettingChange('general', 'maxFileSize', Number(e.target.value))}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                    <InputLabel>Default Language</InputLabel>
                    <Select
                        value={settings.general.defaultLanguage}
                        onChange={(e) => handleSettingChange('general', 'defaultLanguage', e.target.value)}
                        label="Default Language"
                    >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.general.maintenanceMode}
                            onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
                        />
                    }
                    label="Maintenance Mode"
                />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.general.allowUserRegistration}
                            onChange={(e) => handleSettingChange('general', 'allowUserRegistration', e.target.checked)}
                        />
                    }
                    label="Allow User Registration"
                />
            </Grid>
        </Grid>
    );

    const renderEmailSettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="SMTP Host"
                    value={settings.email.smtpHost}
                    onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="SMTP Port"
                    value={settings.email.smtpPort}
                    onChange={(e) => handleSettingChange('email', 'smtpPort', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="SMTP Username"
                    value={settings.email.smtpUser}
                    onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    type="password"
                    label="SMTP Password"
                    value={settings.email.smtpPassword}
                    onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Sender Name"
                    value={settings.email.senderName}
                    onChange={(e) => handleSettingChange('email', 'senderName', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Sender Email"
                    value={settings.email.senderEmail}
                    onChange={(e) => handleSettingChange('email', 'senderEmail', e.target.value)}
                />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.email.enableEmailNotifications}
                            onChange={(e) => handleSettingChange('email', 'enableEmailNotifications', e.target.checked)}
                        />
                    }
                    label="Enable Email Notifications"
                />
            </Grid>
        </Grid>
    );

    const renderSecuritySettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    type="number"
                    label="Minimum Password Length"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', Number(e.target.value))}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    type="number"
                    label="Session Timeout (minutes)"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', Number(e.target.value))}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    type="number"
                    label="Max Login Attempts"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', Number(e.target.value))}
                />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.security.requireSpecialChars}
                            onChange={(e) => handleSettingChange('security', 'requireSpecialChars', e.target.checked)}
                        />
                    }
                    label="Require Special Characters in Password"
                />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.security.requireNumbers}
                            onChange={(e) => handleSettingChange('security', 'requireNumbers', e.target.checked)}
                        />
                    }
                    label="Require Numbers in Password"
                />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.security.twoFactorAuth}
                            onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                        />
                    }
                    label="Enable Two-Factor Authentication"
                />
            </Grid>
        </Grid>
    );

    const renderIntegrationSettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Google Maps API Key"
                    value={settings.integrations.googleMapsApiKey}
                    onChange={(e) => handleSettingChange('integrations', 'googleMapsApiKey', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Stripe Public Key"
                    value={settings.integrations.stripePublicKey}
                    onChange={(e) => handleSettingChange('integrations', 'stripePublicKey', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Stripe Secret Key"
                    type="password"
                    value={settings.integrations.stripeSecretKey}
                    onChange={(e) => handleSettingChange('integrations', 'stripeSecretKey', e.target.value)}
                />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.integrations.enableGoogleAuth}
                            onChange={(e) => handleSettingChange('integrations', 'enableGoogleAuth', e.target.checked)}
                        />
                    }
                    label="Enable Google Authentication"
                />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.integrations.enableFacebookAuth}
                            onChange={(e) => handleSettingChange('integrations', 'enableFacebookAuth', e.target.checked)}
                        />
                    }
                    label="Enable Facebook Authentication"
                />
            </Grid>
        </Grid>
    );

    const renderNotificationSettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.notifications.enablePushNotifications}
                            onChange={(e) => handleSettingChange('notifications', 'enablePushNotifications', e.target.checked)}
                        />
                    }
                    label="Enable Push Notifications"
                />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.notifications.enableEmailDigest}
                            onChange={(e) => handleSettingChange('notifications', 'enableEmailDigest', e.target.checked)}
                        />
                    }
                    label="Enable Email Digest"
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                    <InputLabel>Digest Frequency</InputLabel>
                    <Select
                        value={settings.notifications.digestFrequency}
                        onChange={(e) => handleSettingChange('notifications', 'digestFrequency', e.target.value)}
                        label="Digest Frequency"
                    >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Admin Alert Email"
                    value={settings.notifications.adminAlertEmail}
                    onChange={(e) => handleSettingChange('notifications', 'adminAlertEmail', e.target.value)}
                />
            </Grid>
        </Grid>
    );

    const tabs = [
        { label: 'General', content: renderGeneralSettings },
        { label: 'Email', content: renderEmailSettings },
        { label: 'Security', content: renderSecuritySettings },
        { label: 'Integrations', content: renderIntegrationSettings },
        { label: 'Notifications', content: renderNotificationSettings }
    ];

    return (
        <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">System Settings</Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={fetchSettings}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave(tabs[activeTab].label.toLowerCase())}
                        disabled={loading}
                    >
                        Save Changes
                    </Button>
                </Stack>
            </Stack>

            <Card>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab.label} />
                    ))}
                </Tabs>

                <CardContent>
                    {tabs[activeTab].content()}
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SystemSettings; 