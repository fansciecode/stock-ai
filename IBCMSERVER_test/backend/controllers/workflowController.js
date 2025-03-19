import asyncHandler from 'express-async-handler';
import WorkflowAutomator from '../services/automation/workflowAutomator.js';

// @desc    Automate attendee management
// @route   POST /api/workflow/attendees/:eventId
// @access  Private
export const automateAttendees = asyncHandler(async (req, res) => {
    try {
        const automation = await WorkflowAutomator.autoManageAttendees(req.params.eventId);
        res.json({
            success: true,
            automation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Automate venue management
// @route   POST /api/workflow/venue/:eventId
// @access  Private
export const automateVenue = asyncHandler(async (req, res) => {
    try {
        const automation = await WorkflowAutomator.autoManageVenue(req.params.eventId);
        res.json({
            success: true,
            automation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Automate schedule management
// @route   POST /api/workflow/schedule/:eventId
// @access  Private
export const automateSchedule = asyncHandler(async (req, res) => {
    try {
        const automation = await WorkflowAutomator.autoManageSchedule(req.params.eventId);
        res.json({
            success: true,
            automation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Automate budget management
// @route   POST /api/workflow/budget/:eventId
// @access  Private
export const automateBudget = asyncHandler(async (req, res) => {
    try {
        const automation = await WorkflowAutomator.autoManageBudget(req.params.eventId);
        res.json({
            success: true,
            automation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Automate risk management
// @route   POST /api/workflow/risks/:eventId
// @access  Private
export const automateRisks = asyncHandler(async (req, res) => {
    try {
        const automation = await WorkflowAutomator.autoManageRisks(req.params.eventId);
        res.json({
            success: true,
            automation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Setup automated communications
// @route   POST /api/workflow/communications/:eventId
// @access  Private
export const setupCommunications = asyncHandler(async (req, res) => {
    try {
        const event = await EventModel.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const communications = await WorkflowAutomator.setupAutomatedCommunications(event);
        res.json({
            success: true,
            communications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Automate all workflows for an event
// @route   POST /api/workflow/automate-all/:eventId
// @access  Private
export const automateAllWorkflows = asyncHandler(async (req, res) => {
    try {
        const [
            attendees,
            venue,
            schedule,
            budget,
            risks,
            communications
        ] = await Promise.all([
            WorkflowAutomator.autoManageAttendees(req.params.eventId),
            WorkflowAutomator.autoManageVenue(req.params.eventId),
            WorkflowAutomator.autoManageSchedule(req.params.eventId),
            WorkflowAutomator.autoManageBudget(req.params.eventId),
            WorkflowAutomator.autoManageRisks(req.params.eventId),
            WorkflowAutomator.setupAutomatedCommunications(req.params.eventId)
        ]);

        res.json({
            success: true,
            automations: {
                attendees,
                venue,
                schedule,
                budget,
                risks,
                communications
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}); 