import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  IconButton,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  DateRange,
  LocationOn,
  Person,
  Category,
  AttachMoney,
  Event,
} from "@mui/icons-material";
import EventService from "../../services/eventService";
import { externalEventService } from "../../services/ExternalEventService";
import "./EventDetailsScreen.css";

const eventService = new EventService();

const EventDetailsScreen = () => {
  const { eventId } = useParams();
  const { source } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEventDetails();
  }, [eventId, source]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      let eventData;
      if (source === "google" || source === "EXTERNAL") {
        // Load external event
        const response = await externalEventService.getExternalEventDetails(
          source || "google",
          eventId,
        );
        if (response.success && response.data) {
          eventData = mapExternalEventToInternal(response.data);
        } else {
          throw new Error("Failed to load external event details");
        }
      } else {
        // Load internal event
        eventData = await eventService.getEventDetails(eventId);
      }

      setEvent(eventData);
    } catch (err) {
      setError(err.message || "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const mapExternalEventToInternal = (externalEvent) => {
    return {
      id: externalEvent.id || eventId,
      title: externalEvent.title || externalEvent.name || "Untitled Event",
      description: externalEvent.description || "",
      location: {
        address: externalEvent.address || externalEvent.location?.address || "",
        city: externalEvent.location?.city || "",
        state: externalEvent.location?.state || "",
        country: externalEvent.location?.country || "",
        latitude: externalEvent.location?.latitude || 0,
        longitude: externalEvent.location?.longitude || 0,
        name: externalEvent.title || externalEvent.name || "",
        placeId: externalEvent.id || eventId,
        venue: externalEvent.venue || null,
      },
      imageUrl: externalEvent.photos?.[0] || externalEvent.imageUrl || "",
      price: externalEvent.price || 0,
      categoryId: externalEvent.category || "external",
      maxAttendees: externalEvent.maxAttendees || 0,
      currentAttendees: externalEvent.currentAttendees || 0,
      status: externalEvent.status || "UPCOMING",
      startDate: externalEvent.startDate || externalEvent.date || null,
      endDate: externalEvent.endDate || null,
      organizer: externalEvent.organizer || "Unknown Organizer",
      isExternal: true,
    };
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    loadEventDetails();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5">Event Details</Typography>
        </Box>

        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5">Event Details</Typography>
        </Box>

        <Alert severity="info">No event details available</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1">
          Event Details
        </Typography>
        {event.isExternal && (
          <Chip
            label="External Event"
            color="primary"
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      {/* Event Image */}
      {event.imageUrl && (
        <Card sx={{ mb: 3 }}>
          <CardMedia
            component="img"
            height="300"
            image={event.imageUrl}
            alt={event.title}
            sx={{
              objectFit: "cover",
              borderRadius: 1,
            }}
          />
        </Card>
      )}

      {/* Event Title and Description */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
          {event.title}
        </Typography>

        {event.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {event.description}
          </Typography>
        )}
      </Paper>

      {/* Event Details */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Information
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          {/* Date */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <DateRange sx={{ mr: 1, color: "primary.main" }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date & Time
                </Typography>
                <Typography variant="body1">
                  {formatDate(event.startDate)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Location */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <LocationOn sx={{ mr: 1, color: "primary.main" }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1">
                  {event.location?.address || "Location not specified"}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Price */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <AttachMoney sx={{ mr: 1, color: "primary.main" }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body1">
                  {formatPrice(event.price)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Attendees */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <Person sx={{ mr: 1, color: "primary.main" }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Attendees
                </Typography>
                <Typography variant="body1">
                  {event.maxAttendees > 0
                    ? `${event.currentAttendees || 0} / ${event.maxAttendees}`
                    : "No limit"}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Category */}
          {event.categoryId && (
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={2}>
                <Category sx={{ mr: 1, color: "primary.main" }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1">{event.categoryId}</Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Status */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <Event sx={{ mr: 1, color: "primary.main" }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={event.status || "UPCOMING"}
                  color={event.status === "UPCOMING" ? "success" : "default"}
                  size="small"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Organizer Information */}
      {event.organizer && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Organizer
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1">{event.organizer}</Typography>
        </Paper>
      )}

      {/* Action Buttons */}
      <Box display="flex" gap={2} justifyContent="center" mt={4}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={
            event.status === "COMPLETED" || event.status === "CANCELLED"
          }
          onClick={() => {
            // Handle registration/booking logic here
            console.log("Register for event:", event.id);
          }}
        >
          {event.price > 0 ? "Book Now" : "Register"}
        </Button>

        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={() => {
            // Handle share logic here
            if (navigator.share) {
              navigator.share({
                title: event.title,
                text: event.description,
                url: window.location.href,
              });
            }
          }}
        >
          Share Event
        </Button>
      </Box>
    </Container>
  );
};

export default EventDetailsScreen;
