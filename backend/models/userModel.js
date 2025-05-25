import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
            lowercase: true
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6,
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        isBlocked: { type: Boolean, default: false },
        interests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }], // Tracks categories user is interested in
        preferredCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
        businessInfo: {
            businessName: String,
            businessDescription: String,
            businessWebsite: String,
            businessPhone: String,
            businessEmail: String,
            businessAddress: String,
            categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
            verified: { type: Boolean, default: false }
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                index: '2dsphere'
            },
            city: String
        },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        eventLimit: {
            type: Number,
            default: 10
        },
        eventPackage: {
            type: {
                type: String,
                enum: ['free', 'basic', 'standard', 'premium'],
                default: 'free'
            },
            purchaseDate: Date,
            expiryDate: Date,
            eventsAllowed: Number
        },
        packageHistory: [{
            packageId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'EventPackage'
            },
            name: String,
            purchaseDate: Date,
            expiryDate: Date,
            eventsAllowed: Number,
            eventsUsed: Number,
            status: {
                type: String,
                enum: ['completed', 'expired', 'cancelled']
            }
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        lastLogin: Date,
        createdAt: {
            type: Date,
            default: Date.now
        },
        // Add new field for FCM tokens
        fcmTokens: [{
            token: String,
            device: String,
            lastUsed: Date
        }],
        isAdmin: {
            type: Boolean,
            required: true,
            default: false
        },
        profilePictureUrl: { type: String, default: null },
        backgroundImageUrl: { type: String, default: null },
        isVerified: {
            type: Boolean,
            default: false
        },
        verificationBadge: {
            type: String,
            enum: ['NONE', 'PERSONAL', 'BUSINESS'],
            default: 'NONE'
        },
        verifiedAt: Date,
        profile: {
            firstName: String,
            lastName: String,
            avatar: String,
            bio: String,
            phone: String,
            education: [String],
            dateOfBirth: Date,
            gender: {
                type: String,
                enum: ['male', 'female', 'other', 'prefer_not_to_say']
            }
        },
        address: [{
            type: {
                type: String,
                enum: ['home', 'work', 'other'],
                default: 'home'
            },
            street: String,
            city: String,
            state: String,
            country: String,
            postalCode: String,
            isDefault: Boolean
        }],
        preferences: {
            categories: [String],
            locations: [{
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point'
                },
                coordinates: [Number]
            }],
            notifications: {
                email: {
                    type: Boolean,
                    default: true
                },
                push: {
                    type: Boolean,
                    default: true
                },
                sms: {
                    type: Boolean,
                    default: false
                }
            },
            language: {
                type: String,
                default: 'en'
            },
            currency: {
                type: String,
                default: 'USD'
            }
        },
        security: {
            verificationLevel: {
                type: String,
                enum: ['none', 'email', 'phone', 'id', 'enhanced'],
                default: 'none'
            },
            lastVerified: Date,
            twoFactorEnabled: Boolean,
            verified: {
                type: Boolean,
                default: false
            },
            verificationToken: String,
            resetPasswordToken: String,
            resetPasswordExpires: Date,
            lastPasswordChange: Date
        },
        activity: {
            lastLogin: Date,
            lastActive: Date,
            loginHistory: [{
                timestamp: Date,
                ip: String,
                device: String,
                location: String
            }]
        },
        roles: [{
            type: String,
            enum: ['user', 'admin', 'moderator'],
            default: ['user']
        }],
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended', 'deleted'],
            default: 'active'
        }
    },
    { timestamps: true }
);

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Add new method for checking event creation eligibility
userSchema.methods.canCreateEvent = async function() {
    // Check event limit first (backward compatibility)
    if (this.eventLimit > 0) {
        return {
            canCreate: true,
            eventsRemaining: this.eventLimit
        };
    }

    // Check if user has an active package
    if (this.eventPackage && this.eventPackage.expiryDate) {
        const now = new Date();
        if (now <= this.eventPackage.expiryDate && this.eventPackage.eventsAllowed > 0) {
            return {
                canCreate: true,
                eventsRemaining: this.eventPackage.eventsAllowed,
                packageType: this.eventPackage.type,
                expiryDate: this.eventPackage.expiryDate
            };
        }
    }

    return {
        canCreate: false,
        reason: 'No available events or active package',
        suggestedAction: 'purchase_package'
    };
};

userSchema.index({ 'profile.name': 'text' });
userSchema.index({ 'preferences.locations': '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ status: 1 });
userSchema.index({ roles: 1 });

export const UserModel = mongoose.model("User", userSchema);
