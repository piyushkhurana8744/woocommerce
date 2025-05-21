import mongoose from "mongoose";

interface Integration {
    key: string;
    secret: string;
    userId: mongoose.Types.ObjectId;
    integration:string,
    storeUrl: string;
}

const integration = new mongoose.Schema<Integration>({
    key: {
        type: String,
        required: true,
    },
    storeUrl: {
        type: String,
        required: true,
    },
    secret: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    integration: {
        type: String,
        required: true,
        enum: ["WooCommerce", "shopify"],
    },  

}, { timestamps: true });


export default mongoose.model<Integration>("Integration", integration);