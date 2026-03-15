import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    total: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema({
    billNo: { type: String, required: true, unique: true },
    billTo: {
        name: String,
        phone: String,
        address: String,
    },
    items: [itemSchema],
    subtotal: { type: Number, required: true },
    gstPercent: { type: Number, default: 18 },
    gstAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
}, { timestamps: true });
const productSchema = new mongoose.Schema({
    name: String,
    category: String,   // ring, necklace, bracelet
    weight: Number,
    karat: Number,      // 18k, 22k
    price: Number,
    stock: Number,
    makingCharge: Number,
    gemstone: String,
    image: String,
    status: {
        type: String,
        enum: ["Completed", "Pending", "Cancelled", "Return"],
        default: "Pending"
    }
}, { timestamps: true });
export const Product = mongoose.model("Product", productSchema);
export const Bill = mongoose.model("Bill", invoiceSchema);