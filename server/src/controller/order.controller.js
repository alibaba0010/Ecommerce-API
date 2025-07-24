import { StatusCodes } from "http-status-codes";
import notFoundError from "../errors/notFound.js";
import BadRequestError from "../errors/badRequest.js";
import Product from "../model/product/product.mongo.js";
import Order from "../model/order.mongo.js";
import User from "../model/user/user.mongo.js";
import { getPagination } from "../services/query.js";
import { checkAdmin } from "../model/user/user.model.js";
import Stripe from "stripe";
import paypal from "@paypal/checkout-server-sdk";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// PayPal configuration
const paypalClient = new paypal.core.PayPalHttpClient(
  new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);

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

// CREATE STRIPE PAYMENT SESSION
export async function httpCreateStripeSession(req, res) {
  const { orderId } = req.params;
  const { userId } = req.user;

  const order = await Order.findById(orderId);
  if (!order) throw new notFoundError("Order not found");

  if (order.userId.toString() !== userId) {
    throw new BadRequestError("Not authorized to access this order");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Order #" + order._id,
          },
          unit_amount: Math.round(order.amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/order/success?orderId=${order._id}`,
    cancel_url: `${process.env.CLIENT_URL}/order/cancel?orderId=${order._id}`,
  });

  // Update order with payment intent
  await Order.findByIdAndUpdate(orderId, {
    paymentIntentId: session.payment_intent,
    paymentStatus: "pending",
    paymentMethod: "stripe",
  });

  res.status(StatusCodes.OK).json({ url: session.url });
}

// CREATE PAYPAL PAYMENT
export async function httpCreatePayPalPayment(req, res) {
  const { orderId } = req.params;
  const { userId } = req.user;

  const order = await Order.findById(orderId);
  if (!order) throw new notFoundError("Order not found");

  if (order.userId.toString() !== userId) {
    throw new BadRequestError("Not authorized to access this order");
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: order.amount.toString(),
        },
        reference_id: order._id.toString(),
      },
    ],
  });

  try {
    const paypalOrder = await paypalClient.execute(request);

    // Update order with PayPal order ID
    await Order.findByIdAndUpdate(orderId, {
      paypalOrderId: paypalOrder.result.id,
      paymentStatus: "pending",
      paymentMethod: "paypal",
    });

    res.status(StatusCodes.OK).json({
      orderID: paypalOrder.result.id,
    });
  } catch (err) {
    throw new BadRequestError("Error creating PayPal order");
  }
}

// VERIFY PAYPAL PAYMENT
export async function httpVerifyPayPalPayment(req, res) {
  const { orderId } = req.params;
  const { paypalOrderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new notFoundError("Order not found");

  const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);

    if (capture.result.status === "COMPLETED") {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "completed",
        paidAt: new Date(),
      });

      res.status(StatusCodes.OK).json({ status: "success" });
    } else {
      throw new BadRequestError("Payment not completed");
    }
  } catch (err) {
    throw new BadRequestError("Error verifying PayPal payment");
  }
}

// STRIPE WEBHOOK
export async function httpStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
    if (order) {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "completed",
        paidAt: new Date(),
      });
    }
  }

  res.json({ received: true });
}
