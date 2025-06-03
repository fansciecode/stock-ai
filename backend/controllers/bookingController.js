import asyncHandler from "express-async-handler";
import Booking from "../models/bookingModel.js";
import { EventModel } from "../models/eventModel.js";
import { UserModel } from "../models/userModel.js";
import { generateQR, verifyQR } from "../utils/qrUtils.js";
import logger from "../utils/logger.js";
import PaymentService from '../services/paymentService.js';
import PaymentModel from '../models/paymentModel.js';

// Helper function to generate QR code
const generateQRCode = async (data) => {
    try {
        return await QRCode.toDataURL(data);
    } catch (error) {
        console.error('QR Code generation error:', error);
        return null;
    }
};

// Helper function to generate ticket number
const generateTicketNumber = () => {
    return `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

// Helper function to generate tickets
const generateTickets = async (quantity, bookingId) => {
    return Promise.all(Array(quantity).fill().map(async () => {
        const ticketNumber = generateTicketNumber();
        const qrCode = await generateQRCode(JSON.stringify({
            ticketNumber,
            bookingId,
            timestamp: Date.now()
        }));

        return {
            ticketNumber,
            qrCode,
            isUsed: false,
            createdAt: new Date()
        };
    }));
};

// @desc Create a new booking
// @route POST /api/bookings
// @access Private
const createBooking = asyncHandler(async (req, res) => {
    const { eventId, ticketType, quantity } = req.body;

    const event = await Event.findById(eventId).populate('products');
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    // Check ticket availability and process booking
    // ... existing logic ...

    res.json({
        success: true,
        booking: {
            // ... booking details ...
            products: event.products
        }
    });
});

// @desc Create an enhanced booking
// @route POST /api/bookings/enhanced
// @access Private
const createEnhancedBooking = asyncHandler(async (req, res) => {
    const { eventId, seats, ticketType } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    // Create booking first
    const booking = await Booking.create({
        user: req.user._id,
        event: eventId,
        seats,
        ticketType,
        status: 'pending'
    });

    // Generate tickets after booking is created
    const tickets = await generateTickets(seats, booking._id);
    booking.tickets = tickets;
    await booking.save();

    res.status(201).json(booking);
});

// @desc Get all bookings for a user
// @route GET /api/bookings
// @access Private
const getUserBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.params.userId })
        .populate('event');
    res.json(bookings);
});

// @desc Get all bookings for an event
// @route GET /api/bookings/event/:eventId
// @access Private
const getEventBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ event: req.params.eventId })
        .populate('user', 'name email');
    res.json(bookings);
});

// @desc Get my bookings
// @route GET /api/bookings/my-bookings
// @access Private
const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate('event');
    res.json(bookings);
});

// @desc Get a booking by ID
// @route GET /api/bookings/:id
// @access Private
const getBookingById = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate('event')
        .populate('user', 'name email');

    if (booking) {
        res.json(booking);
    } else {
        res.status(404);
        throw new Error('Booking not found');
    }
});

// @desc Update a booking status
// @route PUT /api/bookings/:id/status
// @access Private
const updateBookingStatus = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (booking) {
        booking.status = req.body.status || booking.status;
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404);
        throw new Error('Booking not found');
    }
});

// @desc Validate a ticket
// @route POST /api/bookings/:id/validate
// @access Private
const validateTicket = asyncHandler(async (req, res) => {
    const { ticketNumber } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    const ticket = booking.tickets?.find(t => t.ticketNumber === ticketNumber);
    
    if (!ticket) {
        res.status(404);
        throw new Error('Ticket not found');
    }

    if (ticket.isUsed) {
        res.status(400);
        throw new Error('Ticket already used');
    }

    ticket.isUsed = true;
    ticket.usedAt = new Date();
    await booking.save();

    res.json({ message: 'Ticket validated successfully' });
});

// @desc Cancel a booking
// @route PUT /api/bookings/:id/cancel
// @access Private
const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Check if user owns the booking or is admin
    if (booking.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error('Not authorized');
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason;

    await booking.save();

    res.json({ message: 'Booking cancelled successfully' });
});

// SAFE ENHANCEMENT - ADD NEW FIELDS WITHOUT BREAKING EXISTING ONES
const enhanceBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Generate tickets if they don't exist
    if (!booking.tickets || booking.tickets.length === 0) {
        booking.tickets = await generateTickets(booking.seats, booking._id);
        await booking.save();
    }

    res.json(booking);
});

// Add checkInBooking function
const checkInBooking = asyncHandler(async (req, res) => {
    const { ticketNumber } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Find the specific ticket
    const ticket = booking.tickets?.find(t => t.ticketNumber === ticketNumber);
    
    if (!ticket) {
        res.status(404);
        throw new Error('Ticket not found');
    }

    // Check if ticket is already used
    if (ticket.isUsed) {
        res.status(400);
        throw new Error('Ticket already used');
    }

    // Verify event date and time if needed
    if (booking.event) {
        const event = await Event.findById(booking.event);
        if (event && new Date(event.date) > new Date()) {
            res.status(400);
            throw new Error('Cannot check in before event date');
        }
    }

    // Mark ticket as used
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    ticket.checkedInBy = req.user._id;
    ticket.checkInLocation = req.body.location || 'Main Entrance';

    // Update booking status if all tickets are used
    const allTicketsUsed = booking.tickets.every(t => t.isUsed);
    if (allTicketsUsed) {
        booking.status = 'completed';
    }

    await booking.save();

    res.json({
        message: 'Check-in successful',
        ticket: {
            ticketNumber,
            checkedInAt: ticket.usedAt,
            location: ticket.checkInLocation
        }
    });
});

// @desc    Generate QR code for ticket
// @route   GET /api/bookings/:bookingId/tickets/:ticketId/qr
// @access  Private
export const generateTicketQR = asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
        _id: req.params.bookingId,
        user: req.user._id
    }).populate('event');

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    const ticket = booking.tickets.id(req.params.ticketId);
    if (!ticket) {
        res.status(404);
        throw new Error('Ticket not found');
    }

    // Generate QR code with booking and event details
    const qrData = {
        ticketId: ticket._id,
        bookingId: booking._id,
        eventId: booking.event._id,
        userId: booking.user,
        timestamp: new Date()
    };

    const qrCode = await generateQR(qrData);
    ticket.qrCode = qrCode;
    await booking.save();

    res.json({
        success: true,
        qrCode,
        ticketDetails: {
            ticketNumber: ticket.ticketNumber,
            event: {
                name: booking.event.name,
                date: booking.event.date,
                venue: booking.event.venue
            },
            seatInfo: ticket.seatInfo,
            status: ticket.status
        }
    });
});

// @desc    Validate ticket at event
// @route   POST /api/events/:eventId/validate-ticket
// @access  Private (Event Creator/Staff only)
export const validateEventTicket = asyncHandler(async (req, res) => {
    const { qrCode } = req.body;
    const event = await Event.findById(req.params.eventId);

    // Check if user is authorized to validate tickets
    if (!event || (event.creator.toString() !== req.user._id.toString() && 
        !event.staff.includes(req.user._id))) {
        res.status(403);
        throw new Error('Not authorized to validate tickets for this event');
    }

    // Verify QR code and get ticket data
    const ticketData = await verifyQR(qrCode);
    if (!ticketData) {
        res.status(400);
        throw new Error('Invalid QR code');
    }

    const booking = await Booking.findById(ticketData.bookingId)
        .populate('user', 'name email')
        .populate('event');

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    const ticket = booking.tickets.id(ticketData.ticketId);
    if (!ticket) {
        res.status(404);
        throw new Error('Ticket not found');
    }

    // Validate ticket status
    if (ticket.status !== 'VALID') {
        res.status(400);
        throw new Error(`Ticket is ${ticket.status.toLowerCase()}`);
    }

    if (ticket.checkedIn.status) {
        res.status(400);
        throw new Error('Ticket already used');
    }

    // Check if event date is valid
    if (new Date(event.date) < new Date()) {
        res.status(400);
        throw new Error('Event has expired');
    }

    // Mark ticket as checked in
    ticket.checkedIn = {
        status: true,
        timestamp: new Date(),
        checkedBy: req.user._id
    };
    ticket.status = 'USED';
    await booking.save();

    res.json({
        success: true,
        message: 'Ticket validated successfully',
        ticketDetails: {
            ticketNumber: ticket.ticketNumber,
            seatInfo: ticket.seatInfo,
            user: {
                name: booking.user.name,
                email: booking.user.email
            },
            event: {
                name: event.name,
                date: event.date,
                venue: event.venue
            },
            checkedIn: ticket.checkedIn
        }
    });
});

// @desc    Get check-in statistics for event
// @route   GET /api/events/:eventId/checkin-stats
// @access  Private (Event Creator only)
export const getEventCheckInStats = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.eventId);
    
    if (!event || event.creator.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const bookings = await Booking.find({ event: event._id });
    
    const stats = {
        totalTickets: 0,
        checkedIn: 0,
        pending: 0,
        cancelled: 0,
        checkInHistory: []
    };

    bookings.forEach(booking => {
        booking.tickets.forEach(ticket => {
            stats.totalTickets++;
            if (ticket.checkedIn.status) {
                stats.checkedIn++;
                stats.checkInHistory.push({
                    timestamp: ticket.checkedIn.timestamp,
                    ticketNumber: ticket.ticketNumber
                });
            } else if (ticket.status === 'CANCELLED') {
                stats.cancelled++;
            } else {
                stats.pending++;
            }
        });
    });

    res.json(stats);
});

// @desc    Moderate event
// @route   PUT /api/events/:eventId/moderate
// @access  Private (Event Creator only)
export const moderateEvent = asyncHandler(async (req, res) => {
    const { eventId, status } = req.body;
    const event = await Event.findById(eventId);

    if (event) {
        event.status = status;
        await event.save();
        res.json({ message: 'Event status updated' });
    } else {
        res.status(404);
        throw new Error('Event not found');
    }
});

// Add new endpoint to initiate payment for booking
export const initiateBookingPayment = asyncHandler(async (req, res) => {
    const { eventId, ticketType, quantity, paymentMethod } = req.body;
    // Validate event and ticket availability as before
    // ...
    // Calculate amount (implement your logic)
    const amount = /* calculate based on event/ticketType/quantity */ 1000;
    // Initiate payment
    const paymentIntent = await PaymentService.createPaymentIntent({
        userId: req.user._id,
        amount,
        currency: 'INR',
        metadata: { eventId, ticketType, quantity, type: 'booking' }
    });
    // Create payment record
    const payment = await PaymentModel.create({
        user: req.user._id,
        event: eventId,
        amount,
        type: 'booking',
        status: 'pending',
        paymentInfo: { ticketType, quantity },
        stripePaymentId: paymentIntent.paymentIntent.id
    });
    res.json({ paymentIntent: paymentIntent.paymentIntent, paymentId: payment._id });
});

// Add new endpoint to confirm booking after payment
export const confirmBookingAfterPayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.body;
    const payment = await PaymentModel.findById(paymentId);
    if (!payment || payment.status !== 'pending') {
        throw new Error('Invalid or already processed payment');
    }
    // Verify payment
    const verified = await PaymentService.verifyPayment(paymentId);
    if (!verified) {
        throw new Error('Payment not verified');
    }
    // Create booking
    const booking = await Booking.create({
        user: payment.user,
        event: payment.event,
        seats: payment.paymentInfo.quantity,
        ticketType: payment.paymentInfo.ticketType,
        status: 'confirmed'
    });
    // Generate tickets
    booking.tickets = await generateTickets(payment.paymentInfo.quantity, booking._id);
    await booking.save();
    payment.status = 'completed';
    await payment.save();
    res.status(201).json(booking);
});

// Single export statement at the end
export {
    createBooking,
    createEnhancedBooking,
    getUserBookings,
    getEventBookings,
    getMyBookings,
    getBookingById,
    updateBookingStatus,
    validateTicket,
    cancelBooking,
    enhanceBooking,
    checkInBooking
};
