import logger from './logger.js';

/**
 * Calculate estimated delivery time based on distance and delivery method
 * @param {Object} params
 * @param {number} params.distance - Distance in kilometers
 * @param {string} params.deliveryMethod - Delivery method (standard/express/same-day)
 * @returns {Object} Estimated delivery window
 */
export const calculateDeliveryTime = ({ distance, deliveryMethod = 'standard' }) => {
    const speeds = {
        'standard': 30, // km per day
        'express': 50,  // km per day
        'same-day': 100 // km per day
    };

    const speed = speeds[deliveryMethod] || speeds.standard;
    const daysToDeliver = Math.ceil(distance / speed);

    const now = new Date();
    const estimatedDelivery = new Date(now.setDate(now.getDate() + daysToDeliver));

    return {
        estimatedDays: daysToDeliver,
        estimatedDate: estimatedDelivery,
        deliveryMethod
    };
};

/**
 * Calculate delivery cost based on distance, weight, and delivery method
 * @param {Object} params
 * @param {number} params.distance - Distance in kilometers
 * @param {number} params.weight - Weight in kilograms
 * @param {string} params.deliveryMethod - Delivery method (standard/express/same-day)
 * @returns {Object} Delivery cost breakdown
 */
export const calculateDeliveryCost = ({ distance, weight, deliveryMethod = 'standard' }) => {
    const baseCosts = {
        'standard': 5,   // Base cost in currency units
        'express': 10,   // Base cost in currency units
        'same-day': 20   // Base cost in currency units
    };

    const distanceRate = {
        'standard': 0.5, // Cost per km
        'express': 1,    // Cost per km
        'same-day': 2    // Cost per km
    };

    const weightRate = {
        'standard': 1,   // Cost per kg
        'express': 2,    // Cost per kg
        'same-day': 4    // Cost per kg
    };

    const baseCost = baseCosts[deliveryMethod] || baseCosts.standard;
    const distanceCost = (distanceRate[deliveryMethod] || distanceRate.standard) * distance;
    const weightCost = (weightRate[deliveryMethod] || weightRate.standard) * weight;

    const totalCost = baseCost + distanceCost + weightCost;

    return {
        baseCost,
        distanceCost,
        weightCost,
        totalCost,
        deliveryMethod
    };
};

/**
 * Validate delivery address and check if delivery is possible
 * @param {Object} address - Delivery address object
 * @returns {Object} Validation result
 */
export const validateDeliveryAddress = (address) => {
    const required = ['street', 'city', 'state', 'postalCode', 'country'];
    const missing = required.filter(field => !address[field]);

    if (missing.length > 0) {
        return {
            isValid: false,
            errors: missing.map(field => `Missing ${field}`),
            message: 'Incomplete address'
        };
    }

    // Additional validation can be added here (e.g., postal code format, supported countries)
    return {
        isValid: true,
        message: 'Valid delivery address'
    };
};

/**
 * Check if COD (Cash on Delivery) is available for the given order
 * @param {Object} params
 * @param {number} params.orderValue - Order value in currency units
 * @param {string} params.deliveryArea - Delivery area code
 * @param {string} params.customerRating - Customer rating (if available)
 * @returns {Object} COD availability status
 */
export const checkCODAvailability = ({ orderValue, deliveryArea, customerRating = 'new' }) => {
    const maxCODValue = 1000; // Maximum allowed COD value
    const restrictedAreas = ['REMOTE', 'HIGH_RISK']; // Areas where COD is not available
    
    if (orderValue > maxCODValue) {
        return {
            available: false,
            reason: 'Order value exceeds maximum COD limit',
            maxLimit: maxCODValue
        };
    }

    if (restrictedAreas.includes(deliveryArea)) {
        return {
            available: false,
            reason: 'COD not available in this area',
            restrictedArea: true
        };
    }

    // Additional checks based on customer rating
    const ratingFactors = {
        'new': true,
        'good': true,
        'average': true,
        'poor': false
    };

    return {
        available: ratingFactors[customerRating] ?? true,
        reason: ratingFactors[customerRating] ? 'COD available' : 'COD restricted due to customer rating',
        customerEligible: ratingFactors[customerRating] ?? true
    };
};

/**
 * Track delivery status and update estimated delivery time
 * @param {Object} params
 * @param {string} params.trackingId - Delivery tracking ID
 * @param {string} params.currentStatus - Current delivery status
 * @param {Date} params.dispatchDate - Dispatch date
 * @returns {Object} Updated tracking information
 */
export const updateDeliveryTracking = ({ trackingId, currentStatus, dispatchDate }) => {
    const statusSequence = [
        'pending',
        'confirmed',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'failed'
    ];

    const currentStatusIndex = statusSequence.indexOf(currentStatus);
    if (currentStatusIndex === -1) {
        logger.error(`Invalid delivery status: ${currentStatus}`);
        throw new Error('Invalid delivery status');
    }

    const dispatchDateTime = new Date(dispatchDate);
    const now = new Date();
    const timeElapsed = now - dispatchDateTime;
    const daysElapsed = timeElapsed / (1000 * 60 * 60 * 24);

    // Calculate new estimated delivery date based on current status
    let newEstimatedDelivery = new Date(dispatchDateTime);
    switch (currentStatus) {
        case 'pending':
        case 'confirmed':
            newEstimatedDelivery.setDate(newEstimatedDelivery.getDate() + 3);
            break;
        case 'picked_up':
        case 'in_transit':
            newEstimatedDelivery.setDate(newEstimatedDelivery.getDate() + 2);
            break;
        case 'out_for_delivery':
            newEstimatedDelivery.setDate(newEstimatedDelivery.getDate() + 1);
            break;
        case 'delivered':
            newEstimatedDelivery = now;
            break;
        default:
            // Handle failed delivery
            newEstimatedDelivery = null;
    }

    return {
        trackingId,
        status: currentStatus,
        statusIndex: currentStatusIndex,
        daysElapsed,
        estimatedDelivery: newEstimatedDelivery,
        isDelayed: newEstimatedDelivery ? now > newEstimatedDelivery : false,
        nextStatus: statusSequence[currentStatusIndex + 1] || null
    };
};

/**
 * Verify COD delivery completion
 * @param {Object} params
 * @param {string} params.orderId - Order ID
 * @param {number} params.collectedAmount - Amount collected from customer
 * @param {string} params.deliveryCode - Verification code provided by customer
 * @returns {Object} Verification result
 */
export const verifyCODDelivery = ({ orderId, collectedAmount, deliveryCode }) => {
    try {
        // Verify delivery code format
        const isValidCode = /^[A-Z0-9]{6}$/.test(deliveryCode);
        if (!isValidCode) {
            return {
                verified: false,
                error: 'Invalid delivery code format'
            };
        }

        // Additional verification logic can be added here
        // For example, checking against expected amount, validating against stored code, etc.

        return {
            verified: true,
            orderId,
            collectedAmount,
            verificationTime: new Date(),
            deliveryCode
        };
    } catch (error) {
        logger.error('Error verifying COD delivery:', error);
        throw new Error('Failed to verify COD delivery');
    }
};

/**
 * Find available delivery partner based on delivery requirements
 * @param {Object} params Order or delivery parameters
 * @returns {Object} Delivery partner details
 */
export const findDeliveryPartner = (params) => {
    try {
        // Handle both new and old parameter formats
        let deliveryArea, deliveryType, packageWeight;

        // If params is an order object (old format)
        if (params.delivery && params.items) {
            deliveryArea = params.delivery.address?.city || 'UNKNOWN';
            deliveryType = params.delivery.type || 'standard';
            packageWeight = params.items.reduce((total, item) => total + (item.weight || 0), 0);
        } 
        // If params is delivery parameters object (new format)
        else {
            deliveryArea = params.deliveryArea;
            deliveryType = params.deliveryType || 'standard';
            packageWeight = params.packageWeight;
        }

        // Mock implementation - in real app this would query delivery partner service
        return {
            partnerId: 'DP' + Math.random().toString(36).substr(2, 9),
            name: 'Express Delivery Services',
            rating: 4.5,
            availableForDelivery: true,
            estimatedPickupTime: new Date(Date.now() + 30 * 60000), // 30 mins from now
            deliveryType,
            maxWeightCapacity: 50, // kg
            serviceArea: deliveryArea
        };
    } catch (error) {
        logger.error('Error finding delivery partner:', error);
        throw new Error('Failed to find delivery partner');
    }
}; 