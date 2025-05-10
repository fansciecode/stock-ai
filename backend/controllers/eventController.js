import asyncHandler from 'express-async-handler';
import { EventModel } from '../models/eventModel.js';
// import PaymentService from "../services/paymentService.js"; // Ensure payment handling

// import { handleEventPayment } from "../services/paymentService.js"; // Ensure this service exists
import { initiatePayment, validateSubscriptionPayment } from "../services/paymentService.js";
import { UserModel } from '../models/userModel.js';
import Category from '../models/categoryModel.js';
import EventOptimizer from '../services/ai/events/eventOptimizer.js';
import EventAutoGenerator from '../services/ai/events/eventAutoGenerator.js';
import mongoose from 'mongoose';
import { processMediaUrls } from '../utils/mediaUtils.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('eventController');

// @desc Create a new event
// @route POST /api/events
// @access Private
export const createEvent = asyncHandler(async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            startDate,
            endDate,
            startDateTime,
            endDateTime,
            latitude,
            longitude,
            city,
            location,
            category,
            categoryId,
            userId,
            organizerId,
            media,
            products,
            services,
            ticketTypes,
            eventType,
            startTime,
            endTime,
            price,
            regularPrice,
            currency,
            tags,
            guidelines,
            maxAttendees
        } = req.body;

        // Log the incoming media for debugging
        logger.info(`Received media: ${JSON.stringify(media)}`);
        
        // Ensure media is properly formatted as an array of objects
        let formattedMedia = [];
        
        if (media) {
            try {
                if (typeof media === 'string') {
                    // Try to parse if it's a stringified JSON
                    try {
                        const parsedMedia = JSON.parse(media);
                        formattedMedia = Array.isArray(parsedMedia) ? parsedMedia : [parsedMedia];
                    } catch (e) {
                        // If parsing fails, treat as a single URL
                        formattedMedia = [{ 
                            id: new mongoose.Types.ObjectId().toString(),
                            caption: 'Media',
                            type: 'image',
                            url: media
                        }];
                    }
                } else if (Array.isArray(media)) {
                    formattedMedia = media;
                } else if (typeof media === 'object') {
                    formattedMedia = [media];
                }
                
                // Ensure each media item has all required fields
                formattedMedia = formattedMedia.map(item => ({
                    id: item.id || new mongoose.Types.ObjectId().toString(),
                    caption: item.caption || '',
                    type: item.type || 'image',
                    url: item.url || ''
                }));
            } catch (mediaError) {
                logger.error(`Error processing media: ${mediaError.message}`);
                formattedMedia = [];
            }
        }
        
        logger.info(`Formatted media: ${JSON.stringify(formattedMedia)}`);
        
        // Process media URLs (especially content URIs from Android)
        const processedMedia = await processMediaUrls(formattedMedia);
        logger.info(`Processed media: ${JSON.stringify(processedMedia)}`);

        // Retrieve user from request object or explicitly passed userId
        const userIdToUse = req.user?._id || userId || organizerId;
        
        if (!userIdToUse) {
            return res.status(400).json({
                success: false,
                message: "User is not defined",
                errorCode: "INTERNAL_ERROR"
            });
        }

        let user;
        try {
            user = await UserModel.findById(userIdToUse);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                    errorCode: "USER_NOT_FOUND"
                });
            }
        } catch (userError) {
            logger.error(`Error finding user: ${userError.message}`);
            return res.status(500).json({
                success: false,
                message: "Error retrieving user data",
                errorCode: "DATABASE_ERROR"
            });
        }

        // Check if user can create event with fallback for missing method
        let eventCheck = { canCreate: true };
        if (typeof user.canCreateEvent === 'function') {
            try {
                eventCheck = await user.canCreateEvent();
            } catch (methodError) {
                logger.error(`Error calling canCreateEvent: ${methodError.message}`);
                // Default to permissive behavior for backward compatibility
                eventCheck = { canCreate: true, reason: 'Method error, allowing creation' };
            }
        }

        if (!eventCheck.canCreate) {
            return res.status(403).json({
                success: false,
                message: 'Event creation limit reached. Please purchase an event package to continue.',
                errorCode: "LIMIT_REACHED"
            });
        }

        // Extract coordinates from either top-level fields or location object
        let coordinates = [0, 0];
        if (latitude && longitude) {
            coordinates = [parseFloat(longitude), parseFloat(latitude)];
        } else if (location && location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
            coordinates = location.coordinates;
        }

        // Create location object
        const eventLocation = {
            type: 'Point',
            coordinates: coordinates,
            city: city || (location && location.city) || 'Unknown'
        };

        // Process pricing information
        const pricingItems = [];
        if (price !== undefined) {
            pricingItems.push({
                type: 'standard',
                amount: parseFloat(price),
                currency: currency || 'USD'
            });
        }
        if (regularPrice !== undefined) {
            pricingItems.push({
                type: 'regular',
                amount: parseFloat(regularPrice),
                currency: currency || 'USD'
            });
        }

        // Process event type
        const eventTypeValue = eventType || 'INFORMATIVE';
        
        // Process tags - ensure eventType is included
        const tagsList = Array.isArray(tags) ? [...tags] : [];
        if (!tagsList.includes(eventTypeValue)) {
            tagsList.push(eventTypeValue);
        }

        // Process tickets if available
        const ticketsList = Array.isArray(ticketTypes) ? ticketTypes : [];
        
        // Process products if available
        const productsList = Array.isArray(products) ? products : [];
        
        // Process services if available
        const servicesList = Array.isArray(services) ? services : [];
        
        // Process guidelines if available
        const guidelinesList = Array.isArray(guidelines) ? guidelines : [];

        // Create event with fields from request
        const eventData = {
            title,
            description,
            date: {
                start: new Date(startDate || startDateTime || date?.start || date || Date.now()),
                end: new Date(endDate || endDateTime || date?.end || date || Date.now())
            },
            startTime: startTime || "00:00",
            endTime: endTime || "00:00",
            location: eventLocation,
            category: categoryId || category || 'Uncategorized',
            organizer: userIdToUse,
            media: processedMedia,
            time: startTime || "00:00",
            maxAttendees: maxAttendees || 100, // Use provided value or default
            status: 'ACTIVE',
            eventType: eventTypeValue,
            tags: tagsList,
            guidelines: guidelinesList,
            ticketTypes: ticketsList,
            products: productsList,
            services: servicesList
        };
        
        // Add pricing if available
        if (pricingItems.length > 0) {
            eventData.pricing = pricingItems;
        }
        
        // Log the complete event data being created - include all fields for debugging
        const logData = {
            ...eventData,
            media: `${processedMedia.length} items`, // Log media length to keep output reasonable
            ticketTypes: ticketsList.length > 0 ? `${ticketsList.length} items` : [],
            products: productsList.length > 0 ? `${productsList.length} items` : [],
            services: servicesList.length > 0 ? `${servicesList.length} items` : []
        };
        
        logger.info(`Creating event with data: ${JSON.stringify(logData)}`);
        
        const event = await EventModel.create(eventData);

        // Update event limit if available (backward compatibility)
        if (user.eventLimit && user.eventLimit > 0) {
            user.eventLimit -= 1;
        
        // If using package system, update package events
        if (user.eventPackage && user.eventPackage.eventsAllowed) {
            user.eventPackage.eventsAllowed -= 1;
        }

        // Add to package history if exists
        if (user.packageHistory) {
            const currentPackage = user.packageHistory.find(
                pkg => pkg.status === 'completed' && pkg.expiryDate > new Date()
            );
            if (currentPackage) {
                currentPackage.eventsUsed = (currentPackage.eventsUsed || 0) + 1;
            }
        }

        await user.save();
        }

        // Get the base URL for API
        const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');

        // Include media upload instructions for Android client in the response
        res.status(201).json({
            success: true,
            data: event,
            remainingEvents: user.eventLimit || 0,
            mediaUploadUrl: `${baseUrl}/api/media/upload`,
            mediaInstructions: "For media items with content:// URIs, please upload via the media API endpoint and update the event"
        });

    } catch (error) {
        logger.error(`Event creation error: ${error}`);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create event",
            errorCode: "INTERNAL_ERROR"
        });
    }
});

// @desc Get all events
// @route GET /api/events
// @access Public
export const getEvents = asyncHandler(async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            city,
            radius = 20,
            page = 1,
            limit = 20,
            format = 'new' // Add format parameter to distinguish between old and new response
        } = req.query;

        // If old format is requested, return original response
        if (format === 'old') {
            const events = await EventModel.find({});
            return res.json(events);
        }

        // Rest of the new implementation...
        const user = await UserModel.findById(req.user._id)
            .populate('interests')
            .select('interests');

        // ... (rest of the new logic)

        res.json({
            success: true,
            data: {
                // ... new format data
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc Get single event by ID
// @route GET /api/events/:id
// @access Public
export const getEvent = asyncHandler(async (req, res) => {
    const event = await EventModel.findById(req.params.id);

    if (event) {
        res.json(event);
    } else {
        res.status(404);
        throw new Error("Event not found");
    }
});

export const getEventsByCategory = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const events = await EventModel.find({ category: categoryId });
  
      if (!events.length) {
        return res.status(404).json({ message: "No events found for this category." });
      }
  
      res.json({ events });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

// @desc Update an event
// @route PUT /api/events/:id
// @access Private
export const updateEvent = asyncHandler(async (req, res) => {
    const event = await EventModel.findById(req.params.id);

    if (event) {
        Object.assign(event, req.body);
        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } else {
        res.status(404);
        throw new Error("Event not found");
    }
});

// @desc Delete an event
// @route DELETE /api/events/:id
// @access Private
export const deleteEvent = asyncHandler(async (req, res) => {
    const event = await EventModel.findById(req.params.id);

    if (event) {
        await event.deleteOne();
        res.json({ message: "Event removed" });
    } else {
        res.status(404);
        throw new Error("Event not found");
    }
});
// @desc    Add a review for an event
// @route   POST /api/events/:id/reviews
// @access  Private
export const addEventReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const event = await EventModel.findById(req.params.id);

    if (event) {
        const alreadyReviewed = event.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            res.status(400);
            throw new Error("Event already reviewed");
        }

        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment,
        };

        event.reviews.push(review);
        event.numReviews = event.reviews.length;
        event.rating =
            event.reviews.reduce((acc, item) => acc + item.rating, 0) /
            event.reviews.length;

        await event.save();
        res.status(201).json({ message: "Review added" });
    } else {
        res.status(404);
        throw new Error("Event not found");
    }
});
export const upgradeEvent = async (req, res) => {
  try {
    const { eventId, paymentDetails } = req.body;

    // Validate event existence
    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if already paid
    if (event.isPaid) {
      return res.status(400).json({ message: "Event is already upgraded" });
    }

    // Process payment (ensure paymentService handles it correctly)
    const paymentSuccess = await handleEventPayment(paymentDetails);

    if (paymentSuccess) {
      event.isPaid = true;
      await event.save();
      return res.status(200).json({ message: "Event upgraded successfully", event });
    } else {
      return res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const upgradeEventPayment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const payment = await initiatePayment(req.user._id, event.price);

    res.status(200).json({
      message: "Payment initiated",
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const confirmUpgradePayment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { paymentId } = req.body;

    const paymentVerified = await validateSubscriptionPayment(paymentId);
    if (!paymentVerified) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const event = await EventModel.findByIdAndUpdate(eventId, { isPaid: true }, { new: true });

    res.status(200).json({ message: "Event upgraded successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Utility function for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

const uploadEventMedia = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { brochures, flyers } = req.body; // Assume URLs are provided

    const event = await EventModel.findById(eventId);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    if (brochures) event.media.brochures = brochures;
    if (flyers) event.media.flyers = flyers;

    await event.save();

    res.json({
        success: true,
        media: event.media
    });
});

const addEventProducts = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { productIds } = req.body;

    const event = await EventModel.findById(eventId);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    event.products = productIds;
    await event.save();

    res.json({
        success: true,
        products: event.products
    });
});

// AI-Enhanced Event Creation
export const createOptimizedEvent = asyncHandler(async (req, res) => {
    try {
        const { eventData } = req.body;
        const creatorType = req.user.verificationBadge === 'BUSINESS' ? 'BUSINESS' : 'USER';

        // Get AI-powered optimization suggestions
        const optimization = await EventOptimizer.optimizeEventCreation(eventData, creatorType);

        // Merge optimization suggestions with user input
        const optimizedEventData = {
            ...eventData,
            ...optimization.suggestedParameters,
            aiOptimizations: optimization,
            organizer: req.user._id
        };

        // Create the event
        const event = await EventModel.create(optimizedEventData);

        res.status(201).json({
            success: true,
            event,
            optimizations: optimization
        });
    } catch (error) {
        console.error('Error creating optimized event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create optimized event'
        });
    }
});

// Get AI Optimization Suggestions
export const getEventOptimizations = asyncHandler(async (req, res) => {
    try {
        const { eventData } = req.body;
        const creatorType = req.user.verificationBadge === 'BUSINESS' ? 'BUSINESS' : 'USER';

        const optimization = await EventOptimizer.optimizeEventCreation(eventData, creatorType);

        res.status(200).json({
            success: true,
            optimizations: optimization
        });
    } catch (error) {
        console.error('Error getting event optimizations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get event optimizations'
        });
    }
});

// Optimize Existing Event
export const optimizeExistingEvent = asyncHandler(async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await EventModel.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const creatorType = event.organizer.verificationBadge === 'BUSINESS' ? 'BUSINESS' : 'USER';
        const optimization = await EventOptimizer.optimizeEventCreation(event, creatorType);

        res.status(200).json({
            success: true,
            currentEvent: event,
            suggestedOptimizations: optimization
        });
    } catch (error) {
        console.error('Error optimizing existing event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to optimize event'
        });
    }
});

// Auto-generate event from minimal input
export const autoGenerateEvent = asyncHandler(async (req, res) => {
    try {
        const { eventType, title, expectedAttendance } = req.body;

        // Validate minimal required inputs
        if (!eventType || !title || !expectedAttendance) {
            return res.status(400).json({
                success: false,
                error: 'Please provide eventType, title, and expectedAttendance'
            });
        }

        // Generate complete event package
        const eventPackage = await EventAutoGenerator.generateFromMinimalInput({
            eventType,
            title,
            expectedAttendance,
            creatorType: req.user.verificationBadge === 'BUSINESS' ? 'BUSINESS' : 'USER'
        });

        // Create the event with generated details
        const event = await EventModel.create({
            ...eventPackage.eventDetails,
            organizer: req.user._id,
            ticketing: eventPackage.ticketing,
            inventory: eventPackage.inventory,
            marketingMaterials: eventPackage.marketingMaterials
        });

        res.status(201).json({
            success: true,
            event,
            ticketing: eventPackage.ticketing,
            inventory: eventPackage.inventory,
            marketingMaterials: eventPackage.marketingMaterials
        });
    } catch (error) {
        console.error('Auto-generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to auto-generate event'
        });
    }
});

export {
    // ... other exports ...
    uploadEventMedia,
    addEventProducts
};
