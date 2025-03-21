import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Divider,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    Security as SecurityIcon,
    Psychology as PsychologyIcon,
    Timeline as TimelineIcon,
    AttachMoney as MoneyIcon,
    Event as EventIcon
} from '@mui/icons-material';
import { adminAIService } from '../../services/adminAIService';
import { useSnackbar } from 'notistack';

export const AIInsightsDashboard = () => {
    const [loading, setLoading] = useState({});
    const [data, setData] = useState({});
    const [error, setError] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const fetchData = async (type) => {
        try {
            setLoading(prev => ({ ...prev, [type]: true }));
            setError(null);

            let response;
            switch (type) {
                case 'behavior':
                    response = await adminAIService.analyzeUserBehavior();
                    break;
                case 'fraud':
                    response = await adminAIService.predictFraud();
                    break;
                case 'insights':
                    response = await adminAIService.generateInsights();
                    break;
                case 'trends':
                    response = await adminAIService.analyzeMarketTrends();
                    break;
                default:
                    throw new Error('Invalid data type');
            }

            setData(prev => ({ ...prev, [type]: response }));
        } catch (err) {
            setError(err.message);
            enqueueSnackbar(err.message, { variant: 'error' });
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    useEffect(() => {
        fetchData('insights');
        fetchData('trends');
    }, []);

    const renderInsightCard = (title, content, icon, type) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="div">
                        {icon}
                        {title}
                    </Typography>
                    <Tooltip title="Refresh">
                        <IconButton 
                            onClick={() => fetchData(type)}
                            disabled={loading[type]}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                {loading[type] ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        {content}
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    const renderTrends = () => {
        if (!data.trends) return null;
        return (
            <Box>
                {data.trends.trends?.map((trend, index) => (
                    <Box key={index} mb={1}>
                        <Chip 
                            label={trend} 
                            color="primary" 
                            variant="outlined" 
                            size="small" 
                        />
                    </Box>
                ))}
            </Box>
        );
    };

    const renderInsights = () => {
        if (!data.insights) return null;
        return (
            <Box>
                {data.insights.recommendations?.map((insight, index) => (
                    <Typography key={index} paragraph>
                        • {insight}
                    </Typography>
                ))}
            </Box>
        );
    };

    if (error) {
        return (
            <Alert 
                severity="error" 
                action={
                    <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                        RETRY
                    </Button>
                }
            >
                {error}
            </Alert>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                AI-Powered Insights Dashboard
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    {renderInsightCard(
                        'Market Trends',
                        renderTrends(),
                        <TrendingUpIcon sx={{ mr: 1 }} />,
                        'trends'
                    )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                    {renderInsightCard(
                        'Business Insights',
                        renderInsights(),
                        <PsychologyIcon sx={{ mr: 1 }} />,
                        'insights'
                    )}
                </Grid>

                <Grid item xs={12} md={6}>
                    {renderInsightCard(
                        'User Behavior Analysis',
                        <Typography>User behavior analysis content</Typography>,
                        <TimelineIcon sx={{ mr: 1 }} />,
                        'behavior'
                    )}
                </Grid>

                <Grid item xs={12} md={6}>
                    {renderInsightCard(
                        'Fraud Detection',
                        <Typography>Fraud detection content</Typography>,
                        <SecurityIcon sx={{ mr: 1 }} />,
                        'fraud'
                    )}
                </Grid>

                <Grid item xs={12} md={6}>
                    {renderInsightCard(
                        'Price Optimization',
                        <Typography>Price optimization content</Typography>,
                        <MoneyIcon sx={{ mr: 1 }} />,
                        'pricing'
                    )}
                </Grid>

                <Grid item xs={12} md={6}>
                    {renderInsightCard(
                        'Event Success Prediction',
                        <Typography>Event success prediction content</Typography>,
                        <EventIcon sx={{ mr: 1 }} />,
                        'events'
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}; 