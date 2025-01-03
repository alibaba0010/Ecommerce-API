import { StatusCodes } from "http-status-codes";
import notFoundError from "../errors/notFound.js";
import BadRequestError from "../errors/badRequest.js";
import Product from "../model/product/product.mongo.js";
import Order from "../model/order.mongo.js";
import User from "../model/user/user.mongo.js";
import { getPagination } from "../services/query.js";
import { checkAdmin } from "../model/user/user.model.js";

// CREATE ORDER
export async function httpCreateOrder(req, res) {
  const { userId } = req.user;
  const { products } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Login to Order Product");

  const ProductId = products.map((product) => product.productId);
  const data = await Product.findById(ProductId);
  if (!data) throw new notFoundError("Product not Found");

  const tax = data.price * 0.05;
  const shippingFee = data.price * 0.02;
  const subtotal = data.price + tax;
  const amount = subtotal + shippingFee;
  const newOrder = await Order.create({
    products,
    tax,
    shippingFee,
    subtotal,
    amount,
  });
  return res.status(StatusCodes.CREATED).json({
    status: newOrder.status,
    amount: newOrder.amount,
    tax: newOrder.tax,
    products: newOrder.products,
    subtotal: newOrder.subtotal,
    shippingFee: newOrder.shippingFee,
    address: newOrder.address,
  });
}

// UPDATE ORDER
export async function httpUpdateOrder(req, res) {
  const { id: orderId } = req.params;
  const { userId } = req.user;
  const order = req.body;

  await checkAdmin(userId);
  const updateOrder = await Order.findByIdAndUpdate(
    orderId,
    { $set: order },
    { new: true }
  );
  return res.status(204).json(updateOrder);
}

// DELETE ORDER
export async function httpDeleteOrder(req, res) {
  const { id: orderId } = req.params;
  const { userId } = req.user;

  await checkAdmin(userId);

  await Order.findByIdAndDelete(orderId);
  if (!orderId) {
    return res.status(404).json({
      err: "Product not found",
    });
  }
  return res.status(200).json({
    msg: `${orderId} deleted`,
  });
}

// GET A SPECIFIC ORDER
export async function httpGetOrder(req, res) {
  const orderId = req.params.id;
  const { userId } = req.user;

  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Login to add Product to cart");

  const order = await Order.findById({ userId: orderId });
  if (order.isAdmin === true) {
    return await res.status(200).json(order);
  }
  return res.status(404).json({
    err: "Only admin is ascessible",
  });
}

// GET ALL ORDERS
export async function httpGetAllOrders(req, res) {
  const { userId } = req.user;
  const user = await User.findById(userId);

  await checkAdmin(userId);

  const { skip, limit } = getPagination(req.query);
  const orders = await Order.find({}, { _id: 0, __v: 0 })
    .sort({ id: 1 })
    .skip(skip)
    .limit(limit);
  return await res.status(200).json(orders);
}
// TO GET INCOME OF A PARTICULAR PERIOD
export async function httpGetIncome(req, res) {
  const { userId } = req.user;

  await checkAdmin(userId);

  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const previousMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: previousMonth } } },
    { $project: { month: { $month: "$createdAt" }, sales: "$amount" } },
    { $group: { _id: "$month", total: { $sum: "$sales" } } },
  ]);
  return await res.status(StatusCodes.OK).json(data);
}
