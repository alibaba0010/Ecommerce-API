import pkg from "mongoose";
const { Schema, model, Types } = pkg;

const ProductSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      unique: [true, "Product name already in use"],
    },
    desc: {
      type: String,
      required: [true, "Please provide description"],
    },

    categories: {
      // More than one categroies
      type: Array,
      required: [true, "Please provide categories"],
    },
    color: {
      type: String,
      required: [true, "Please provide color information"],

    },
    size: {
      type: String,
      required: [true, "Please provide size information"],
    },
    price: {
      type: Number,
      required: [true, "Please provide price information"],
    },
    image: {
      type: Object,
      required: [true, "Please provide an image"],
    },
    quantity: {
      type: Number,
      required: [true, "Please provide quantity"],
    },
  },
  { timestamps: true }
);

export default model("Product", ProductSchema);
