import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    enum: ['appetizers', 'mains', 'sides', 'desserts', 'beverages'],
  },
  image: { type: String, default: '' },
  available: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 15 }, // minutes
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);

