import pkg from "mongoose";
const { Schema, model, Types } = pkg;

const OrderSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
    },
    products: [
      {
        productId: { type: Types.ObjectId, ref: "Product" },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    tax: {
      type: Number,
      // required: [true, "Please provide tax information"],
    },
    subtotal: { type: Number },
    shippingFee: { type: Number },
    amount: { type: Number },
    address: {
      type: String,
      // required: [true, "Please provide address information"],
    },
    status: {
      type: String,
      enum: ["pending", "failed", "paid", "delivered", "canceled"],
      default: "pending",
    },
    paymentInformation: {
      type: String,
    },
    // clientSecret: {
    //   type: String,
    // },
    // paymentIntentId: {
    //   type: String,
    // },
  },
  { timestamps: true }
);

export default model("Order", OrderSchema);
