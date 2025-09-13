
// ingestOrders.js
const axios = require("axios");
const mysql = require("mysql2/promise");

// --- Shopify credentials ---
const SHOP = "hema-fde-test-store.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;


// --- MySQL connection ---
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // your MySQL password
  database: "shopify_data",
};

async function saveOrdersToDB(orders) {
  const connection = await mysql.createConnection(dbConfig);

  for (const order of orders) {
    try {
      const {
        id,
        customer,
        total_price,
        financial_status,
        created_at,
        updated_at,
      } = order;

      const customer_id = customer ? customer.id : null;

      await connection.execute(
        `INSERT INTO orders
        (order_id, tenant_id, customer_id, total_price, status, created_at, updated_at)
        VALUES (?, 1, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_price = VALUES(total_price),
          status = VALUES(status),
          updated_at = VALUES(updated_at)`,
        [id, customer_id, total_price, financial_status, created_at, updated_at]
      );

      console.log(`✅ Order saved: ${id}`);
    } catch (err) {
      console.error("Error saving order:", order.id, err.message);
    }
  }

  await connection.end();
}

async function fetchAllOrders() {
  let ordersFetched = [];
  let url = `https://${SHOP}/admin/api/2025-01/orders.json?status=any&limit=250`;
  let hasNext = true;

  while (hasNext) {
    try {
      const response = await axios.get(url, {
        headers: {
          "X-Shopify-Access-Token": TOKEN,
          "Content-Type": "application/json",
        },
      });

      const orders = response.data.orders;
      ordersFetched = ordersFetched.concat(orders);

      // Check for pagination via Link header
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        // Extract next page URL
        const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        url = matches ? matches[1] : null;
        hasNext = !!url;
      } else {
        hasNext = false;
      }
    } catch (err) {
      console.error("Error fetching orders:", err.response?.data || err.message);
      hasNext = false;
    }
  }

  return ordersFetched;
}

async function ingestOrders() {
  const allOrders = await fetchAllOrders();

  if (!allOrders || allOrders.length === 0) {
    console.log("No orders found.");
    return;
  }

  await saveOrdersToDB(allOrders);
  console.log("🎉 All orders ingestion completed!");
}

ingestOrders();
