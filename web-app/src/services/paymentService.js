import api from "./api";

class PaymentService {
  // Get event upgrade pricing
  async getEventUpgradePrice(eventId) {
    try {
      const response = await api.get(
        `/payment/upgrade-price/${eventId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching upgrade price:", error);
      throw error;
    }
  }

  // Get event upgrade options
  async getEventUpgradeOptions(eventId) {
    try {
      const response = await api.get(
        `/payment/upgrade-options/${eventId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching upgrade options:", error);
      throw error;
    }
  }

  // Create payment intent
  async createPaymentIntent(paymentData) {
    try {
      const response = await api.post(
        "/payment/create-payment-intent",
        paymentData,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  }

  // Initiate payment
  async initiatePayment(paymentData) {
    try {
      const response = await api.post("/payment/create", paymentData);
      return response.data;
    } catch (error) {
      console.error("Error initiating payment:", error);
      throw error;
    }
  }

  // Confirm payment
  async confirmPayment(paymentData) {
    try {
      const response = await api.post("/payment/confirm", paymentData);
      return response.data;
    } catch (error) {
      console.error("Error confirming payment:", error);
      throw error;
    }
  }

  // Process event upgrade payment
  async processEventUpgrade(eventId, upgradeData) {
    try {
      const response = await api.post(
        `/payment/upgrade/${eventId}`,
        upgradeData,
      );
      return response.data;
    } catch (error) {
      console.error("Error processing event upgrade:", error);
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(paymentData) {
    try {
      const response = await api.post("/payment/verify", paymentData);
      return response.data;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentIntentId) {
    try {
      const response = await api.get(
        `/payment/status/${paymentIntentId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching payment status:", error);
      throw error;
    }
  }

  // Process refund
  async processRefund(refundData) {
    try {
      const response = await api.post("/payment/refund", refundData);
      return response.data;
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(subscriptionData) {
    try {
      const response = await api.post(
        "/payment/subscribe",
        subscriptionData,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await api.delete(
        `/payment/subscribe/${subscriptionId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  }

  // Process subscription payment
  async processSubscriptionPayment(subscriptionData) {
    try {
      const response = await api.post(
        "/payment/subscription/payment",
        subscriptionData,
      );
      return response.data;
    } catch (error) {
      console.error("Error processing subscription payment:", error);
      throw error;
    }
  }

  // Create external payment
  async createExternalPayment(paymentData) {
    try {
      const response = await api.post(
        "/payment/external/create",
        paymentData,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating external payment:", error);
      throw error;
    }
  }

  // Verify external payment
  async verifyExternalPayment(paymentId, verificationData) {
    try {
      const response = await api.post(
        `/payment/external/verify/${paymentId}`,
        verificationData,
      );
      return response.data;
    } catch (error) {
      console.error("Error verifying external payment:", error);
      throw error;
    }
  }

  // Get external payment status
  async getExternalPaymentStatus(paymentId) {
    try {
      const response = await api.get(`/payment/external/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching external payment status:", error);
      throw error;
    }
  }

  // Razorpay integration helpers
  loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async initiateRazorpayPayment(paymentData) {
    const scriptLoaded = await this.loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error("Razorpay SDK failed to load");
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: paymentData.amount * 100, // Convert to paise
        currency: paymentData.currency || "INR",
        name: "IBCM Events",
        description: paymentData.description || "Event Payment",
        order_id: paymentData.orderId,
        handler: function (response) {
          resolve(response);
        },
        prefill: {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          contact: paymentData.customerPhone,
        },
        notes: paymentData.notes || {},
        theme: {
          color: "#1976d2",
        },
        modal: {
          ondismiss: function () {
            reject(new Error("Payment cancelled by user"));
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  // Stripe integration helpers
  loadStripeScript() {
    return new Promise((resolve) => {
      if (window.Stripe) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async initiateStripePayment(paymentData) {
    const scriptLoaded = await this.loadStripeScript();

    if (!scriptLoaded) {
      throw new Error("Stripe SDK failed to load");
    }

    const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

    const { error } = await stripe.redirectToCheckout({
      sessionId: paymentData.sessionId,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Utility functions
  formatAmount(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  validatePaymentData(paymentData) {
    const required = ["amount", "currency", "description"];
    const missing = required.filter((field) => !paymentData[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    if (paymentData.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    return true;
  }

  // Payment status constants
  static PAYMENT_STATUS = {
    PENDING: "pending",
    PROCESSING: "processing",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
  };

  // Payment method constants
  static PAYMENT_METHODS = {
    RAZORPAY: "razorpay",
    STRIPE: "stripe",
    EXTERNAL: "external",
  };

  // Event upgrade types
  static UPGRADE_TYPES = {
    BASIC_TO_PREMIUM: "basic_to_premium",
    PREMIUM_TO_ENTERPRISE: "premium_to_enterprise",
    BASIC_TO_ENTERPRISE: "basic_to_enterprise",
  };

  // Get user subscriptions
  async getUserSubscriptions(userId) {
    try {
      const response = await api.get(`/users/${userId}/subscriptions`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      throw error;
    }
  }

  // Get available plans
  async getAvailablePlans() {
    try {
      const response = await api.get("/payment/plans");
      return response.data;
    } catch (error) {
      console.error("Error fetching available plans:", error);
      throw error;
    }
  }

  // Get billing history
  async getBillingHistory() {
    try {
      const response = await api.get("/payment/billing-history");
      return response.data;
    } catch (error) {
      console.error("Error fetching billing history:", error);
      throw error;
    }
  }

  // Get usage data
  async getUsageData() {
    try {
      const response = await api.get("/payment/usage");
      return response.data;
    } catch (error) {
      console.error("Error fetching usage data:", error);
      throw error;
    }
  }

  // Upgrade subscription
  async upgradeSubscription(subscriptionData) {
    try {
      const response = await api.post(
        "/payment/subscription/upgrade",
        subscriptionData,
      );
      return response.data;
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      throw error;
    }
  }

  // Downgrade subscription
  async downgradeSubscription(subscriptionData) {
    try {
      const response = await api.post(
        "/payment/subscription/downgrade",
        subscriptionData,
      );
      return response.data;
    } catch (error) {
      console.error("Error downgrading subscription:", error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscriptionDetails(subscriptionId) {
    try {
      const response = await api.get(
        `/payment/subscription/${subscriptionId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching subscription details:", error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId, updateData) {
    try {
      const response = await api.put(
        `/payment/subscription/${subscriptionId}`,
        updateData,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }

  // Pause subscription
  async pauseSubscription(subscriptionId) {
    try {
      const response = await api.post(
        `/payment/subscription/${subscriptionId}/pause`,
      );
      return response.data;
    } catch (error) {
      console.error("Error pausing subscription:", error);
      throw error;
    }
  }

  // Resume subscription
  async resumeSubscription(subscriptionId) {
    try {
      const response = await api.post(
        `/payment/subscription/${subscriptionId}/resume`,
      );
      return response.data;
    } catch (error) {
      console.error("Error resuming subscription:", error);
      throw error;
    }
  }

  // Get payment methods
  async getPaymentMethods() {
    try {
      const response = await api.get("/payment/methods");
      return response.data;
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }
  }

  // Add payment method
  async addPaymentMethod(paymentMethodData) {
    try {
      const response = await api.post(
        "/payment/methods",
        paymentMethodData,
      );
      return response.data;
    } catch (error) {
      console.error("Error adding payment method:", error);
      throw error;
    }
  }

  // Delete payment method
  async deletePaymentMethod(paymentMethodId) {
    try {
      const response = await api.delete(
        `/payment/methods/${paymentMethodId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting payment method:", error);
      throw error;
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId) {
    try {
      const response = await api.post(
        `/payment/methods/${paymentMethodId}/default`,
      );
      return response.data;
    } catch (error) {
      console.error("Error setting default payment method:", error);
      throw error;
    }
  }

  // Get invoice
  async getInvoice(invoiceId) {
    try {
      const response = await api.get(`/payment/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching invoice:", error);
      throw error;
    }
  }

  // Download invoice
  async downloadInvoice(invoiceId) {
    try {
      const response = await api.get(
        `/payment/invoices/${invoiceId}/download`,
        {
          responseType: "blob",
        },
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error("Error downloading invoice:", error);
      throw error;
    }
  }

  // Apply coupon
  async applyCoupon(couponCode) {
    try {
      const response = await api.post("/payment/coupons/apply", {
        code: couponCode,
      });
      return response.data;
    } catch (error) {
      console.error("Error applying coupon:", error);
      throw error;
    }
  }

  // Remove coupon
  async removeCoupon(couponId) {
    try {
      const response = await api.delete(`/payment/coupons/${couponId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing coupon:", error);
      throw error;
    }
  }

  // Calculate tax
  async calculateTax(amount, location) {
    try {
      const response = await api.post("/payment/tax/calculate", {
        amount,
        location,
      });
      return response.data;
    } catch (error) {
      console.error("Error calculating tax:", error);
      throw error;
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(dateRange) {
    try {
      const response = await api.get("/payment/analytics", {
        params: dateRange,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching payment analytics:", error);
      throw error;
    }
  }

  // Subscription status constants
  static SUBSCRIPTION_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    CANCELLED: "cancelled",
    PAUSED: "paused",
    EXPIRED: "expired",
  };

  // Plan types
  static PLAN_TYPES = {
    BASIC: "basic",
    PREMIUM: "premium",
    ENTERPRISE: "enterprise",
  };

  // Billing cycles
  static BILLING_CYCLES = {
    MONTHLY: "monthly",
    YEARLY: "yearly",
  };
}

export default new PaymentService();
