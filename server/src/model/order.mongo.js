import pkg from "mongoose";
const { Schema, model, Types } = pkg;

const SingleItemOrderSchema = new Schema({
  name: { type: String, required: [true, "Please provide name"], },
  image: { type: String, required: [true, "Please provide image"], },
  price: { type: Number, required: [true, "Please provide price"], },
  amount: { type: Number, required: [true, "Please provide amount"], },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
  },
});

const OrderSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
    },
    tax: {
      type: Number,
      required: [true, "Please provide username"],
    },
    subtotal: {
      type: Number,
      required: [true, "Please provide username"],
    },
    total: {
      type: Number,
      required: [true, "Please provide username"],
    },
    shippingFee: {
      type: Number,
      required: [true, "Please provide username"],
    },
    orderItems: [SingleItemOrderSchema],
    amount: {
      type: Number,
      required: [true, "Please provide username"],
    },
    address: {
      type: Object,
      required: [true, "Please provide username"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "failed", "paid", "delivered", "canceled"],
      default: "pending",
    },
    clientSecret: {
      type: String,
      required: [true, "Please provide username"],
    },
    paymentIntentId: {
      type: String,
    },
  },
  { timestamps: true }
);

export default model("Order", OrderSchema);
