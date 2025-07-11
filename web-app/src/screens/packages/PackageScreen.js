import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Paper,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  Check,
  Star,
  Event,
  AttachMoney,
  BusinessCenter,
  ShoppingCart,
  Info,
} from "@mui/icons-material";
import { packageService } from "../../services/PackageService";
import { userService } from "../../services/userService";
import "./PackageScreen.css";

const PackageScreen = () => {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [userLimit, setUserLimit] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadPackages();
    loadUserLimit();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const packagesData = await packageService.getAvailablePackages();
      setPackages(packagesData);
    } catch (err) {
      setError(err.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const loadUserLimit = async () => {
    try {
      const limitData = await userService.getUserEventLimit();
      setUserLimit(limitData);
    } catch (err) {
      console.error("Failed to load user limit:", err);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setPurchasing(true);
      await packageService.purchasePackage(selectedPackage.id);

      // Show success message and navigate back
      alert("Package purchased successfully!");
      navigate("/dashboard");
    } catch (err) {
      alert("Failed to purchase package: " + err.message);
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const showEventLimitDialog = () => {
    setShowLimitDialog(true);
  };

  const hideEventLimitDialog = () => {
    setShowLimitDialog(false);
  };

  const formatPrice = (price, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const getPackageColor = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes("premium") || name.includes("pro")) return "primary";
    if (name.includes("basic") || name.includes("starter")) return "secondary";
    if (name.includes("enterprise")) return "error";
    return "default";
  };

  const getPackageIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes("premium") || name.includes("pro")) return <Star />;
    if (name.includes("enterprise")) return <BusinessCenter />;
    return <Event />;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={50} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5">Event Packages</Typography>
        </Box>

        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadPackages}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Event Packages
        </Typography>
      </Box>

      {/* User Limit Info */}
      {userLimit && (
        <Paper
          elevation={1}
          sx={{
            p: 3,
            mb: 4,
            bgcolor: "info.light",
            color: "info.contrastText",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Info />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Current Usage
              </Typography>
              <Typography variant="body2">
                You have used {userLimit.usedEvents} out of{" "}
                {userLimit.totalEvents} events
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Package Description */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Choose the perfect package for your event management needs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upgrade your plan to create more events and access premium features
        </Typography>
      </Box>

      {/* Packages Grid */}
      <Grid container spacing={3}>
        {packages.map((pkg) => (
          <Grid item xs={12} md={6} lg={4} key={pkg.id}>
            <Card
              elevation={3}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                {/* Package Header */}
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getPackageIcon(pkg.planName)}
                  <Typography variant="h5" component="h2" fontWeight="bold">
                    {pkg.planName}
                  </Typography>
                  <Chip
                    label={
                      pkg.planName.includes("Popular") ? "Popular" : "Plan"
                    }
                    color={getPackageColor(pkg.planName)}
                    size="small"
                  />
                </Box>

                {/* Package Description */}
                {pkg.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{ mb: 3 }}
                  >
                    {pkg.description}
                  </Typography>
                )}

                {/* Price */}
                <Box mb={3}>
                  <Typography
                    variant="h3"
                    component="div"
                    fontWeight="bold"
                    color="primary"
                  >
                    {formatPrice(pkg.price, pkg.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pkg.eventLimit} Events included
                  </Typography>
                </Box>

                {/* Features */}
                {pkg.features && pkg.features.length > 0 && (
                  <Box mb={3}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Features:
                    </Typography>
                    <List dense>
                      {pkg.features.map((feature, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Check color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              variant: "body2",
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Package Stats */}
                <Box mb={3}>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Event Limit
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {pkg.eventLimit}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Validity
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {pkg.validityPeriod || "1 Year"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Select Button */}
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => handlePackageSelect(pkg)}
                  startIcon={<ShoppingCart />}
                  sx={{ mt: "auto" }}
                >
                  Select Package
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {packages.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="300px"
        >
          <Event sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No packages available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back later for new packages
          </Typography>
        </Box>
      )}

      {/* Purchase Confirmation Dialog */}
      <Dialog
        open={!!selectedPackage}
        onClose={() => setSelectedPackage(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Package Purchase</DialogTitle>
        <DialogContent>
          {selectedPackage && (
            <>
              <DialogContentText>
                Are you sure you want to purchase the {selectedPackage.planName}{" "}
                package?
              </DialogContentText>

              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Package Details:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • Price:{" "}
                  {formatPrice(selectedPackage.price, selectedPackage.currency)}
                </Typography>
                <Typography variant="body2">
                  • Events: {selectedPackage.eventLimit}
                </Typography>
                <Typography variant="body2">
                  • Validity: {selectedPackage.validityPeriod || "1 Year"}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPackage(null)}>Cancel</Button>
          <Button
            onClick={handlePurchase}
            variant="contained"
            disabled={purchasing}
            startIcon={
              purchasing ? <CircularProgress size={20} /> : <ShoppingCart />
            }
          >
            {purchasing ? "Processing..." : "Purchase"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Limit Dialog */}
      <Dialog
        open={showLimitDialog}
        onClose={hideEventLimitDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Event Creation Limit Reached</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have used {userLimit?.usedEvents || 0} out of{" "}
            {userLimit?.totalEvents || 0} events.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Purchase a package to create more events and access premium
            features.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={hideEventLimitDialog}>Cancel</Button>
          <Button onClick={hideEventLimitDialog} variant="contained" autoFocus>
            View Packages
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PackageScreen;
