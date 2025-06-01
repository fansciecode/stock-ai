import mongoose from 'mongoose';

const upgradePricingSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  upgradePricing: {
    type: Object,
    required: true
  }
}, { timestamps: true, collection: 'upgradepricings' });

const UpgradePricingModel = mongoose.model('UpgradePricing', upgradePricingSchema);

export default UpgradePricingModel; 