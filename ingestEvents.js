const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");

const app = express();
app.use(bodyParser.json());

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "shopify_data",
};

async function startServer() {
  const connection = await mysql.createConnection(DB_CONFIG);

  app.post("/orders/create", async (req, res) => {
    const order = req.body;
    // Save order to DB
    await connection.execute(
      "INSERT INTO orders (order_id, tenant_id, customer_id, total_price, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        order.id,
        1, // tenant_id
        order.customer?.id || null,
        order.total_price,
        order.status,
        new Date(order.created_at),
        new Date(order.updated_at),
      ]
    );
    console.log("Webhook received: order saved", order.id);
    res.status(200).send("OK");
  });

  app.listen(3000, () => {
    console.log("Listening for webhooks on port 3000");
  });
}

startServer();

import crypto from 'crypto';

function verifyShopifyWebhook(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const body = req.rawBody; // make sure to save raw body
  const generatedHmac = crypto
    .createHmac('sha256', '8f79483cc330aa5db17bb7542d3ab901890491712a105804065244a1729f9bfd')
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hmac, 'base64'), Buffer.from(generatedHmac, 'base64'));
}

