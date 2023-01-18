import { createTransport } from "nodemailer";

import asyncHandler from "express-async-handler";

export const sendEmail = asyncHandler(
  async (message, subject, sentFrom, sendTo, replyTo) => {
    const transporter = createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
    // Option for sending email
    const options = {
      from: sentFrom,
      to: sendTo,
      replyTo: replyTo,
      subject: subject,
      html: message,
    };

    await transporter.sendMail(options, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    });
  }
);
