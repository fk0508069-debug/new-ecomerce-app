import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', productSchema);
