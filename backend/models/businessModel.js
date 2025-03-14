import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['RETAIL', 'RESTAURANT', 'SERVICE', 'EVENT_ORGANIZER'],
    required: true
  },
  registrationDetails: {
    registrationNumber: {
      type: String,
      required: true,
      unique: true
    },
    registrationType: {
      type: String,
      enum: ["SOLE_PROPRIETORSHIP", "PARTNERSHIP", "LLC", "CORPORATION"],
      required: true
    },
    registrationDate: Date,
    expiryDate: Date
  },
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    documents: [{
      type: String,
      fileUrl: String,
      verified: Boolean
    }]
  },
  operationalStatus: {
    isActive: {
      type: Boolean,
      default: true
    },
    openingHours: {
      monday: [{ start: String, end: String }],
      tuesday: [{ start: String, end: String }],
      wednesday: [{ start: String, end: String }],
      thursday: [{ start: String, end: String }],
      friday: [{ start: String, end: String }],
      saturday: [{ start: String, end: String }],
      sunday: [{ start: String, end: String }]
    }
  },
  // Inventory Management
  inventory: {
    enabled: {
      type: Boolean,
      default: true
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    autoReorder: {
      type: Boolean,
      default: false
    }
  },
  // Order Management
  orderSettings: {
    acceptingOrders: {
      type: Boolean,
      default: true
    },
    minimumOrderAmount: {
      type: Number,
      default: 0
    },
    maxOrdersPerSlot: {
      type: Number,
      default: 50
    },
    preparationTime: {
      type: Number,
      default: 30 // minutes
    }
  },
  // Delivery Settings
  deliverySettings: {
    providesDelivery: {
      type: Boolean,
      default: false
    },
    radius: {
      type: Number,
      default: 5 // kilometers
    },
    fees: {
      base: Number,
      perKm: Number
    },
    slots: [{
      time: String,
      maxOrders: Number
    }]
  },
  // Payment Settings
  paymentSettings: {
    acceptedMethods: [{
      type: String,
      enum: ['CARD', 'UPI', 'WALLET', 'COD']
    }],
    autoAcceptPayments: {
      type: Boolean,
      default: true
    },
    minimumDepositAmount: {
      type: Number,
      default: 0
    }
  },
  // Analytics
  analytics: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 }
  },
  contactInfo: {
    email: {
      type: String,
      required: true
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  businessProfile: {
    description: String,
    website: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String
    },
    businessHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    }
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"],
    default: "PENDING_VERIFICATION"
  }
}, {
  timestamps: true
});

// Methods for business operations
businessSchema.methods.isOperational = function() {
  if (!this.operationalStatus.isActive || !this.verificationStatus.isVerified) {
    return false;
  }
  // Check current time against operating hours
  const now = new Date();
  const day = now.toLocaleLowerCase();
  const time = now.toTimeString().slice(0, 5);
  
  const todayHours = this.operationalStatus.openingHours[day];
  return todayHours.some(slot => time >= slot.start && time <= slot.end);
};

businessSchema.methods.canAcceptOrder = function(orderAmount, deliveryRequired) {
  if (!this.isOperational() || !this.orderSettings.acceptingOrders) {
    return false;
  }

  if (orderAmount < this.orderSettings.minimumOrderAmount) {
    return false;
  }

  if (deliveryRequired && !this.deliverySettings.providesDelivery) {
    return false;
  }

  return true;
};

businessSchema.methods.updateAnalytics = async function(orderData) {
  this.analytics.totalOrders += 1;
  this.analytics.totalRevenue += orderData.total;
  this.analytics.averageOrderValue = 
    this.analytics.totalRevenue / this.analytics.totalOrders;
  
  if (!this.analytics.customerSet) {
    this.analytics.customerSet = new Set();
  }
  this.analytics.customerSet.add(orderData.user.toString());
  this.analytics.totalCustomers = this.analytics.customerSet.size;
  
  await this.save();
};

// Integrate with verification system
businessSchema.methods.updateVerificationStatus = async function (verificationData, adminUser) {
  this.verificationStatus.isVerified = true;
  this.verificationStatus.verifiedAt = Date.now();
  this.verificationStatus.verifiedBy = adminUser._id;
  this.status = "ACTIVE";
  
  // Update documents verification status
  if (verificationData.documents) {
    this.verificationStatus.documents = verificationData.documents;
  }
  
  await this.save();
  
  // Update associated user's verification badge
  const User = mongoose.model("User");
  await User.findByIdAndUpdate(this.user, {
    isVerified: true,
    verificationBadge: "BUSINESS"
  });
};

export const BusinessModel = mongoose.model("Business", businessSchema);
