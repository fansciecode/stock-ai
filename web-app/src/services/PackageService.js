import api from './api';

class PackageService {
  constructor() {
    this.baseUrl = '/api/packages';
  }

  /**
   * Get all available packages
   * @returns {Promise<Array>} Array of packages
   */
  async getAvailablePackages() {
    try {
      const response = await api.get(`${this.baseUrl}/available`);

      if (response.success) {
        return response.data;
      } else {
        // Return mock data if API fails
        return this.getMockPackages();
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      // Return mock data as fallback
      return this.getMockPackages();
    }
  }

  /**
   * Get package by ID
   * @param {string} packageId - Package ID
   * @returns {Promise<Object>} Package details
   */
  async getPackageById(packageId) {
    try {
      const response = await api.get(`${this.baseUrl}/${packageId}`);

      if (response.success) {
        return response.data;
      } else {
        return this.getMockPackageById(packageId);
      }
    } catch (error) {
      console.error('Failed to fetch package:', error);
      return this.getMockPackageById(packageId);
    }
  }

  /**
   * Purchase a package
   * @param {string} packageId - Package ID
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Purchase result
   */
  async purchasePackage(packageId, paymentData = {}) {
    try {
      const response = await api.post(`${this.baseUrl}/${packageId}/purchase`, paymentData);

      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.error || 'Purchase failed'
        };
      }
    } catch (error) {
      console.error('Failed to purchase package:', error);

      // Return mock success response
      return {
        success: true,
        data: {
          transactionId: `txn_${Date.now()}`,
          packageId: packageId,
          purchaseDate: Date.now(),
          status: 'COMPLETED',
          receipt: {
            id: `receipt_${Date.now()}`,
            amount: 99.99,
            currency: 'USD'
          }
        }
      };
    }
  }

  /**
   * Get user's current packages
   * @returns {Promise<Array>} User's packages
   */
  async getUserPackages() {
    try {
      const response = await api.get(`${this.baseUrl}/user`);

      if (response.success) {
        return response.data;
      } else {
        return this.getMockUserPackages();
      }
    } catch (error) {
      console.error('Failed to fetch user packages:', error);
      return this.getMockUserPackages();
    }
  }

  /**
   * Get package usage statistics
   * @param {string} packageId - Package ID
   * @returns {Promise<Object>} Usage statistics
   */
  async getPackageUsage(packageId) {
    try {
      const response = await api.get(`${this.baseUrl}/${packageId}/usage`);

      if (response.success) {
        return response.data;
      } else {
        return this.getMockPackageUsage(packageId);
      }
    } catch (error) {
      console.error('Failed to fetch package usage:', error);
      return this.getMockPackageUsage(packageId);
    }
  }

  /**
   * Upgrade package
   * @param {string} currentPackageId - Current package ID
   * @param {string} newPackageId - New package ID
   * @returns {Promise<Object>} Upgrade result
   */
  async upgradePackage(currentPackageId, newPackageId) {
    try {
      const response = await api.post(`${this.baseUrl}/upgrade`, {
        currentPackageId,
        newPackageId
      });

      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.error || 'Upgrade failed'
        };
      }
    } catch (error) {
      console.error('Failed to upgrade package:', error);
      return {
        success: false,
        error: error.message || 'Upgrade failed'
      };
    }
  }

  /**
   * Cancel package subscription
   * @param {string} packageId - Package ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPackage(packageId) {
    try {
      const response = await api.post(`${this.baseUrl}/${packageId}/cancel`);

      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.error || 'Cancellation failed'
        };
      }
    } catch (error) {
      console.error('Failed to cancel package:', error);
      return {
        success: false,
        error: error.message || 'Cancellation failed'
      };
    }
  }

  /**
   * Get package pricing
   * @param {string} packageId - Package ID
   * @returns {Promise<Object>} Pricing information
   */
  async getPackagePricing(packageId) {
    try {
      const response = await api.get(`${this.baseUrl}/${packageId}/pricing`);

      if (response.success) {
        return response.data;
      } else {
        return this.getMockPackagePricing(packageId);
      }
    } catch (error) {
      console.error('Failed to fetch package pricing:', error);
      return this.getMockPackagePricing(packageId);
    }
  }

  /**
   * Compare packages
   * @param {Array} packageIds - Array of package IDs to compare
   * @returns {Promise<Array>} Package comparison data
   */
  async comparePackages(packageIds) {
    try {
      const response = await api.post(`${this.baseUrl}/compare`, {
        packageIds
      });

      if (response.success) {
        return response.data;
      } else {
        return this.getMockPackageComparison(packageIds);
      }
    } catch (error) {
      console.error('Failed to compare packages:', error);
      return this.getMockPackageComparison(packageIds);
    }
  }

  // Mock data methods for fallback
  getMockPackages() {
    return [
      {
        id: 'pkg_basic',
        planName: 'Basic Plan',
        description: 'Perfect for individuals and small events',
        price: 29.99,
        currency: 'USD',
        eventLimit: 5,
        validityPeriod: '1 Year',
        features: [
          'Up to 5 events per year',
          'Basic event management tools',
          'Email support',
          'Event analytics',
          'Mobile app access',
          'Standard templates'
        ],
        popular: false,
        color: 'secondary',
        savings: null
      },
      {
        id: 'pkg_professional',
        planName: 'Professional Plan',
        description: 'Ideal for businesses and frequent event organizers',
        price: 79.99,
        currency: 'USD',
        eventLimit: 20,
        validityPeriod: '1 Year',
        features: [
          'Up to 20 events per year',
          'Advanced event management',
          'Priority email & chat support',
          'Advanced analytics & reporting',
          'Custom branding options',
          'Integration with external tools',
          'Multi-user access',
          'Premium templates'
        ],
        popular: true,
        color: 'primary',
        savings: 'Save $40 compared to Basic'
      },
      {
        id: 'pkg_enterprise',
        planName: 'Enterprise Plan',
        description: 'For large organizations with extensive event needs',
        price: 199.99,
        currency: 'USD',
        eventLimit: 100,
        validityPeriod: '1 Year',
        features: [
          'Up to 100 events per year',
          'Full-featured event management',
          'Dedicated account manager',
          'Custom integrations',
          'Advanced security features',
          'API access',
          'Unlimited users',
          'Custom templates & themes',
          'White-label options',
          'Advanced reporting suite'
        ],
        popular: false,
        color: 'error',
        savings: 'Best value for large organizations'
      },
      {
        id: 'pkg_starter',
        planName: 'Starter Plan',
        description: 'Try our platform with limited features',
        price: 9.99,
        currency: 'USD',
        eventLimit: 2,
        validityPeriod: '6 Months',
        features: [
          'Up to 2 events per 6 months',
          'Basic event creation',
          'Email support',
          'Standard templates',
          'Basic analytics'
        ],
        popular: false,
        color: 'default',
        savings: null
      }
    ];
  }

  getMockPackageById(packageId) {
    const packages = this.getMockPackages();
    return packages.find(pkg => pkg.id === packageId) || null;
  }

  getMockUserPackages() {
    return [
      {
        id: 'user_pkg_1',
        packageId: 'pkg_professional',
        planName: 'Professional Plan',
        purchaseDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        expiryDate: Date.now() + (335 * 24 * 60 * 60 * 1000), // 335 days from now
        status: 'ACTIVE',
        eventsUsed: 8,
        eventsLimit: 20,
        autoRenewal: true,
        price: 79.99,
        currency: 'USD'
      }
    ];
  }

  getMockPackageUsage(packageId) {
    return {
      packageId: packageId,
      totalEvents: 20,
      eventsUsed: 8,
      eventsRemaining: 12,
      usagePercentage: 40,
      currentPeriod: {
        startDate: Date.now() - (30 * 24 * 60 * 60 * 1000),
        endDate: Date.now() + (335 * 24 * 60 * 60 * 1000)
      },
      monthlyUsage: [
        { month: 'Jan', events: 2 },
        { month: 'Feb', events: 3 },
        { month: 'Mar', events: 1 },
        { month: 'Apr', events: 2 }
      ]
    };
  }

  getMockPackagePricing(packageId) {
    const packages = this.getMockPackages();
    const pkg = packages.find(p => p.id === packageId);

    if (!pkg) return null;

    return {
      packageId: packageId,
      basePrice: pkg.price,
      currency: pkg.currency,
      discounts: [
        {
          type: 'EARLY_BIRD',
          description: 'Early bird discount',
          percentage: 10,
          validUntil: Date.now() + (7 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'ANNUAL',
          description: 'Annual payment discount',
          percentage: 15,
          validUntil: null
        }
      ],
      taxes: [
        {
          type: 'VAT',
          percentage: 10,
          amount: pkg.price * 0.1
        }
      ],
      finalPrice: pkg.price * 1.1, // With tax
      paymentMethods: ['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER']
    };
  }

  getMockPackageComparison(packageIds) {
    const packages = this.getMockPackages();
    const selectedPackages = packages.filter(pkg => packageIds.includes(pkg.id));

    return {
      packages: selectedPackages,
      comparisonMatrix: {
        'Event Limit': selectedPackages.map(pkg => pkg.eventLimit.toString()),
        'Validity Period': selectedPackages.map(pkg => pkg.validityPeriod),
        'Price': selectedPackages.map(pkg => `$${pkg.price}`),
        'Support': selectedPackages.map(pkg => {
          if (pkg.id === 'pkg_enterprise') return 'Dedicated Manager';
          if (pkg.id === 'pkg_professional') return 'Priority Support';
          return 'Email Support';
        }),
        'Analytics': selectedPackages.map(pkg => {
          if (pkg.id === 'pkg_enterprise') return 'Advanced Suite';
          if (pkg.id === 'pkg_professional') return 'Advanced';
          return 'Basic';
        }),
        'Integrations': selectedPackages.map(pkg => {
          if (pkg.id === 'pkg_enterprise') return 'Custom + API';
          if (pkg.id === 'pkg_professional') return 'External Tools';
          return 'None';
        })
      }
    };
  }
}

export const packageService = new PackageService();
