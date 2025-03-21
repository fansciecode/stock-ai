
import Subscription from "../models/subscriptionModel.js";
import { UserModel } from "../models/userModel.js";
import PaymentModel  from "../models/paymentModel.js";
import asyncHandler from "express-async-handler";
import { verifyExternalPayment } from "../services/paymentService.js";

// Fetch available subscription plans
export const getSubscriptionPlans = asyncHandler(async (req, res) => {
  const plans = await Subscription.find({});
  res.json(plans);
});

// Purchase a subscription
export const purchaseSubscription = asyncHandler(async (req, res) => {
  const { planId, paymentInfo } = req.body;
  const user = req.user;

  const plan = await Subscription.findById(planId);
  if (!plan) {
    res.status(404);
    throw new Error("Subscription plan not found");
  }

  // Create a pending payment entry
  const payment = await Payment.create({
    user: user._id,
    plan: planId,
    amount: plan.price,
    status: "Pending",
    paymentInfo,
  });

  res.json({ message: "Payment initiated", paymentId: payment._id, amount: plan.price  });
});

// Verify payment and enable event creation
export const verifySubscriptionPayment = asyncHandler(async (req, res) => {
  const { paymentId, status } = req.body;
  const payment = await Payment.findById(paymentId);
  
  if (!payment || payment.status !== "Pending") {
    res.status(400);
    throw new Error("Invalid payment verification request");
  }

  if (status === "Success") {
    payment.status = "Completed";
    await payment.save();

    // Update user's event limit based on subscription
    const user = await User.findById(payment.user);
    const plan = await Subscription.findById(payment.plan);
    if (user && plan) {
      user.eventLimit += plan.eventLimit;
      await user.save();
    }

    res.json({ message: "Subscription activated", eventLimit: user.eventLimit });
  } else {
    payment.status = "Failed";
    await payment.save();
    res.status(400).json({ message: "Payment failed" });
  }
});

export const getSubscriptionStats = async (req, res) => {
  try {
    const stats = await Subscription.aggregate([
      { $group: { _id: "$planName", totalSubscribers: { $sum: 1 } } },
    ]);

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const { transactionId, planName, eventLimit, price } = req.body;
    const userId = req.user._id;

    if (!transactionId || !planName || !eventLimit || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify payment before creating subscription
    const paymentVerified = await verifyExternalPayment(transactionId);

    if (!paymentVerified.success) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const newSubscription = new Subscription({
      user: userId,
      planName,
      eventLimit,
      price,
      expiryDate,
    });

    await newSubscription.save();

    res.status(201).json({ message: "Subscription activated", subscription: newSubscription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};