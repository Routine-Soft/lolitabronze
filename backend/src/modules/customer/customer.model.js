// modules/customer/customer.model.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);