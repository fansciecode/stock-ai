import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Button,
    Alert
} from '@mui/material';
import AnalyticsService from '../../services/analyticsService';
import AutomationService from '../../services/automationService';

const AIInsightsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [insights, setInsights] = useState({
        events: null,
        users: null,
        revenue: null,
        system: null
    });
    const [automationStatus, setAutomationStatus] = useState({
        contentModeration: null,
        userIssues: null,
        eventQuality: null,
        systemHealth: null
    });

    useEffect(() => {
        fetchInsights();
        fetchAutomationStatus();
    }, []);

    const fetchInsights = async () => {
        try {
            const [events, users, revenue, system] = await Promise.all([
                AnalyticsService.getEventAnalytics('month'),
                AnalyticsService.getUserAnalytics(),
                AnalyticsService.getRevenueAnalytics('month'),
                AnalyticsService.getPlatformHealth()
            ]);

            setInsights({
                events,
                users,
                revenue,
                system
            });
        } catch (error) {
            setError('Failed to fetch insights');
            console.error('Error fetching insights:', error);
        }
    };

    const fetchAutomationStatus = async () => {
        try {
            const [moderation, issues, quality, health] = await Promise.all([
                AutomationService.moderateContent(),
                AutomationService.manageUserIssues(),
                AutomationService.monitorEventQuality(),
                AutomationService.monitorSystemHealth()
            ]);

            setAutomationStatus({
                contentModeration: moderation,
                userIssues: issues,
                eventQuality: quality,
                systemHealth: health
            });
        } catch (error) {
            setError('Failed to fetch automation status');
            console.error('Error fetching automation status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchInsights();
        fetchAutomationStatus();
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">AI Insights Dashboard</Typography>
                <Button variant="contained" onClick={handleRefresh}>
                    Refresh Data
                </Button>
            </Box>

            {error && (
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={handleRefresh}>
                        RETRY
                    </Button>
                }>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Event Insights */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Event Insights
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {insights.events?.insights?.summary}
                            </Typography>
                            {insights.events?.trends && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2">
                                        Trending Categories:
                                    </Typography>
                                    <ul>
                                        {insights.events.trends.map((trend, index) => (
                                            <li key={index}>{trend}</li>
                                        ))}
                                    </ul>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* User Analytics */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                User Analytics
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {insights.users?.insights?.summary}
                            </Typography>
                            {insights.users?.segments && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2">
                                        User Segments:
                                    </Typography>
                                    <ul>
                                        {Object.entries(insights.users.segments).map(([key, value]) => (
                                            <li key={key}>{`${key}: ${value.length} users`}</li>
                                        ))}
                                    </ul>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Revenue Insights */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Revenue Analytics
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {insights.revenue?.insights?.summary}
                            </Typography>
                            {insights.revenue?.forecasts && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2">
                                        Revenue Forecast:
                                    </Typography>
                                    <Typography variant="body2">
                                        {insights.revenue.forecasts.nextMonth}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* System Health */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                System Health
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {insights.system?.insights?.summary}
                            </Typography>
                            {insights.system?.recommendations && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2">
                                        Optimization Recommendations:
                                    </Typography>
                                    <ul>
                                        {insights.system.recommendations.map((rec, index) => (
                                            <li key={index}>{rec}</li>
                                        ))}
                                    </ul>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Automation Status */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Automation Status
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={3}>
                                    <Typography variant="subtitle2">
                                        Content Moderation
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {automationStatus.contentModeration?.summary}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Typography variant="subtitle2">
                                        User Issues
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {automationStatus.userIssues?.summary}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Typography variant="subtitle2">
                                        Event Quality
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {automationStatus.eventQuality?.summary}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Typography variant="subtitle2">
                                        System Health
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {automationStatus.systemHealth?.summary}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AIInsightsDashboard; 