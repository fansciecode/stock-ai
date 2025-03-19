import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planNamename: { type: String, required: true },
    eventLimit: { type: Number, required: true },
    price: { type: Number, required: true },
    duration: { type: String, enum: ["Day", "Month", "Year"], required: true },
    status: { type: String, enum: ["active", "expired"], default: "active" },
    expiryDate: { type: Date, required: true },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
