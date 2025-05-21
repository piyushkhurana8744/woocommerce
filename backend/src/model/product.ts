import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["CREATED_LOCALLY", "SYNCED_TO_WC", "SYNC_FAILED"],
    default: "CREATED_LOCALLY"
  },
  wcProductId: {
    type: Number,
    default: null
  },
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

const Product = mongoose.model("Product", productSchema);
export default Product;