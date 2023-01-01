import pkg from "mongoose";
const { Schema, model } = pkg;

const ProductSchema = new Schema(
  {
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
    },
    color: {
      type: String,
    },
    size: {
      type: String,
      required: [true, "Please provide size"],
    },
    price: {
      type: Number,
      required: [true, "Please provide price"],
    },
  },
  { timestamps: true }
);

export default model("Product", ProductSchema);
