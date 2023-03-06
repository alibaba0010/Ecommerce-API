import pkg from "mongoose";
const { Schema, model, Types } = pkg;

const CartSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: "User",
    required: [true, "Please provide username"],
  },
  products: [
    {
      productId: {
        type: Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
});

export default model("Cart", CartSchema);
