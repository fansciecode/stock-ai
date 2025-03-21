import express from 'express';
import {
    automateAttendees,
    automateVenue,
    automateSchedule,
    automateBudget,
    automateRisks,
    setupCommunications,
    automateAllWorkflows
} from '../controllers/workflowController.js';
import { protect, isSeller } from '../middleware/authMiddleware.js';

const router = express.Router();

// Individual workflow automation routes
router.post('/attendees/:eventId', protect, automateAttendees);
router.post('/venue/:eventId', protect, automateVenue);
router.post('/schedule/:eventId', protect, automateSchedule);
router.post('/budget/:eventId', protect, automateBudget);
router.post('/risks/:eventId', protect, automateRisks);
router.post('/communications/:eventId', protect, setupCommunications);

// Automate all workflows at once
router.post('/automate-all/:eventId', protect, automateAllWorkflows);

export default router; 