import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_KEY);

export const stripePayment = async (req, res) => {
  const { tokenId, payment, amount } = req.body;
  stripe.charges.create(
    {
      source: tokenId,
      amount,
      currency: "usd",
    },
    (err, response) => {
      if (err) {
      } else {
        res.status().json({ response });
      }
    }
  );
};

const { purchase, total_amount, shipping_fee } = req.body;

  const calculateOrderAmount = () => {
    return total_amount + shipping_fee;
  };

  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(),
    currency: 'usd',
  });

  res.json({ clientSecret: paymentIntent.client_secret });