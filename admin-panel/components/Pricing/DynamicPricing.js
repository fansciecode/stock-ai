import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Stack,
    Grid,
    Switch,
    FormControlLabel,
    Alert,
    Divider,
    Slider,
    Select,
    MenuItem,
    InputLabel,
    FormControl
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { pricing, analytics } from '../../services/api';

const DynamicPricing = () => {
    const [settings, setSettings] = useState({
        enabled: false,
        demandMultiplier: 1.0,
        competitionFactor: 1.0,
        maxPriceIncrease: 50,
        minPriceDecrease: 10,
        autoAdjust: true,
        categories: []
    });

    const [insights, setInsights] = useState({
        priceHistory: [],
        recommendations: [],
        competitorPrices: []
    });

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSettings();
        fetchInsights();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await pricing.getDynamicPricing();
            setSettings(response.data);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchInsights = async () => {
        try {
            const response = await analytics.getDynamicPricingInsights();
            setInsights(response.data);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await pricing.updateDynamicPricing(settings);
            setSuccess('Dynamic pricing settings updated successfully');
            fetchInsights();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Box>
            <Typography variant="h6" mb={3}>Dynamic Pricing Configuration</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Stack spacing={3}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.enabled}
                                            onChange={handleChange('enabled')}
                                        />
                                    }
                                    label="Enable Dynamic Pricing"
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.autoAdjust}
                                            onChange={handleChange('autoAdjust')}
                                        />
                                    }
                                    label="Auto-adjust Prices"
                                />

                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <MenuItem value="all">All Categories</MenuItem>
                                        <MenuItem value="entertainment">Entertainment</MenuItem>
                                        <MenuItem value="sports">Sports</MenuItem>
                                        <MenuItem value="food">Food & Beverages</MenuItem>
                                        {/* Add more categories */}
                                    </Select>
                                </FormControl>

                                <Typography gutterBottom>Demand Multiplier</Typography>
                                <Slider
                                    value={settings.demandMultiplier}
                                    onChange={(e, value) => setSettings(prev => ({
                                        ...prev,
                                        demandMultiplier: value
                                    }))}
                                    min={0.5}
                                    max={2}
                                    step={0.1}
                                    marks
                                    valueLabelDisplay="auto"
                                />

                                <Typography gutterBottom>Competition Factor</Typography>
                                <Slider
                                    value={settings.competitionFactor}
                                    onChange={(e, value) => setSettings(prev => ({
                                        ...prev,
                                        competitionFactor: value
                                    }))}
                                    min={0.5}
                                    max={2}
                                    step={0.1}
                                    marks
                                    valueLabelDisplay="auto"
                                />

                                <TextField
                                    label="Maximum Price Increase (%)"
                                    type="number"
                                    value={settings.maxPriceIncrease}
                                    onChange={handleChange('maxPriceIncrease')}
                                    fullWidth
                                />

                                <TextField
                                    label="Minimum Price Decrease (%)"
                                    type="number"
                                    value={settings.minPriceDecrease}
                                    onChange={handleChange('minPriceDecrease')}
                                    fullWidth
                                />

                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" mb={2}>Price Trends</Typography>
                            <Box sx={{ height: 300 }}>
                                <LineChart
                                    width={500}
                                    height={300}
                                    data={insights.priceHistory}
                                    margin={{
                                        top: 5,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#8884d8"
                                        activeDot={{ r: 8 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="competitorAvg"
                                        stroke="#82ca9d"
                                    />
                                </LineChart>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" mb={2}>Price Recommendations</Typography>
                            <Stack spacing={2}>
                                {insights.recommendations.map((rec, index) => (
                                    <Alert
                                        key={index}
                                        severity={rec.type}
                                        sx={{ '& .MuiAlert-message': { width: '100%' } }}
                                    >
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                        >
                                            <Typography variant="body2">
                                                {rec.message}
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => {
                                                    // Handle price adjustment
                                                }}
                                            >
                                                Apply
                                            </Button>
                                        </Stack>
                                    </Alert>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DynamicPricing; 