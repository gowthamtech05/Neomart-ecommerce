import dotenv from "dotenv";
dotenv.config();

import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/orderModel.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});
export const createPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
    };

    const order = await razorpay.orders.create(options);

    res.json({
      ...order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

// ✅ FIXED — update the order after verification
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // ✅ Actually update the order
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        isPaid: true,
        paidAt: new Date(),
        orderStatus: "Paid",
        paymentResult: {
          id: razorpay_payment_id,
          order_id: razorpay_order_id,
          signature: razorpay_signature,
        },
      });
    }

    return res.status(200).json({ message: "Payment verified successfully" });
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};
