import Order from "../model/order/order.mongo.js";
import Product from "../model/product/product.mongo.js";
import { addNewOrder } from "../model/order/order.model.js";

import { getPagination } from "../services/query.js";

// CREATE ORDER
export async function httpCreateOrder(req, res) {
  const order = req.body;
  await addNewOrder(order);
  return res.status(201).json(order);
}

// UPDATE ORDER
export async function httpUpdateOrder(req, res) {
  const orderId = req.params.id;
  const order = req.body;
  const updateOrder = await Order.findByIdAndUpdate(
    orderId,
    { $set: order },
    { new: true }
  );
  return res.status(204).json(updateOrder);
}

// DELETE ORDER
export async function httpDeleteOrder(req, res) {
  const orderId = req.params.id;
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
  const { skip, limit } = getPagination();
  const orders = await Order.find({}, { _id: 0, __v: 0 })
    .sort({ id: 1 })
    .skip(skip)
    .limit(limit);
  return await res.status(200).json(orders);
}
// TO GET INCOME OF A PARTICULAR PERIOD
export async function httpGetIncome(req, res) {
  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const previousMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: previousMonth } } },
    { $project: { month: { $month: "$createdAt" }, sales: "$amount" } },
    { $group: { _id: "$month", total: { $sum: "$sales" } } },
  ]);
  return await res.status(200).json(data);
}
