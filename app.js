import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDb } from "./db.js"
import { Bill, Product } from "./bill.model.js"
import uploads from "./multer.js"
import cloudinary from "./cloudinary.js"
const FRONT_END_URI = process.env.FRONT_END_URI;
const app = express();
app.use(cors({
    origin: FRONT_END_URI,
    credentials: true
}));
app.use(express.json());
connectDb()
let items = []; // in-memory DB
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "uploads" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        stream.end(buffer);
    });
};

//add product
app.post("/api/product", uploads.single("image"), async (req, res) => {
    console.log("req: ", req?.body, req.file)
    const result = await uploadToCloudinary(req.file.buffer)
    console.log("result: ", result)
    const product = await Product.create({ ...req.body, image: result?.secure_url });
    console.log("Created: ", product)
    res.status(200).json({ success: true, product });
});

// Add item to bill
app.post("/api/items", async (req, res) => {
    try {
        console.log("start: ", req.body) // create bill
        const items = req?.body?.items
        const billTo = "Kanha"
        const billNo = `KS${Date.now()}`
        let billItems = [];
        for (const i of items) {

            const product = await Product.findOne({ name: i.name });
            console.log("1. product: ", product)
            const price = product.price;
            const qty = Number(i.qty);

            billItems.push({
                name: product.name,
                price,
                qty,
                total: price * qty
            });
            const update = await Product.updateOne(
                { name: i.name },
                { $inc: { stock: -qty } }
            );
            console.log('2. Update: ', update)
        }
        console.log("3. Bill Items: ", billItems)
        const subtotal = billItems.reduce((s, i) => s + i.total, 0);

        const gstPercent = 18;
        const gstAmount = subtotal * gstPercent / 100;
        const grandTotal = subtotal + gstAmount;

        const invoice = await Bill.create({
            billNo,
            billTo,
            items: billItems,
            subtotal,
            gstPercent,
            gstAmount,
            grandTotal
        });
        console.log("invoice: ", invoice)
        res.status(201).json({ success: true, invoice });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get all items in dashboard
app.get("/api/items-dashboard", async (req, res) => {
    const totalProducts = await Product.countDocuments({})
    const revenue = await Bill.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$grandTotal" }
            }
        }
    ]);
    const eachProduct = await Product.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 },
                totalStock: { $sum: "$stock" }
            }
        }
    ]);
    // console.log("all products: ", totalProducts, eachProduct)
    res.status(200).json({ success: true, totalProducts, eachProduct, revenue });
});

app.get("/api/items", async (req, res) => {
    const products = await Product.find({})
    res.status(200).json({ success: true, products });
});
const otpStore = {};
app.post("/generate-otp", (req, res) => {
    const phone = req.body.phone;

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[phone] = otp;
    const waLink = `https://wa.me/${phone}?text=My%20OTP%20is%20${otp}`;
    console.log("object filled: ", otpStore)
    res.json({
        otp,
        wa_link: waLink
    });
});
app.post("/verify-otp", (req, res) => {
    console.log("1. verify: ", req?.body)
    const { otp } = req.body;
    const phone = req.body.verifyPhone
    console.log("OBJECT: ", otpStore)
    if (otpStore[phone] && otpStore[phone] === Number(otp)) {
        console.log("2. verified")
        return res.json({ success: true, status: "verified" });
    }
    console.log("2. Unverified")
    res.json({ success: false, status: "invalid" });
});
export default app