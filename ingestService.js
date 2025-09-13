const axios = require("axios");
const mysql = require("mysql2/promise");

// Shopify store info
const SHOP = "hema-fde-test-store.myshopify.com";
const TOKEN = "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"; // <-- your actual token

// MySQL connection config
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // your MySQL password
  database: "shopify_data",
};

async function fetchProducts() {
  try {
    const res = await axios.get(`https://${SHOP}/admin/api/2025-01/products.json`, {
      headers: { "X-Shopify-Access-Token": TOKEN },
    });
    return res.data.products;
  } catch (err) {
    console.error("Error fetching products:", err.response?.data || err.message);
    return [];
  }
}

async function fetchCustomers() {
  try {
    const res = await axios.get(`https://${SHOP}/admin/api/2025-01/customers.json`, {
      headers: { "X-Shopify-Access-Token": TOKEN },
    });
    return res.data.customers;
  } catch (err) {
    console.error("Error fetching customers:", err.response?.data || err.message);
    return [];
  }
}

async function fetchOrders() {
  try {
    const res = await axios.get(`https://${SHOP}/admin/api/2025-01/orders.json`, {
      headers: { "X-Shopify-Access-Token": TOKEN },
    });
    return res.data.orders;
  } catch (err) {
    console.error("Error fetching orders:", err.response?.data || err.message);
    return [];
  }
}

async function saveProductsToDB(products, connection) {
  for (const p of products) {
    await connection.execute(
      `INSERT INTO products (product_id, tenant_id, title, vendor, product_type, status, created_at, updated_at)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), vendor = VALUES(vendor), product_type = VALUES(product_type), status = VALUES(status), updated_at = VALUES(updated_at)`,
      [p.id, p.title, p.vendor, p.product_type, p.status, p.created_at, p.updated_at]
    );
    console.log(`✅ Product saved: ${p.title}`);
  }
}

async function saveCustomersToDB(customers, connection) {
  for (const c of customers) {
    await connection.execute(
      `INSERT INTO customers (customer_id, tenant_id, first_name, last_name, email, state, created_at, updated_at)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), email = VALUES(email), state = VALUES(state), updated_at = VALUES(updated_at)`,
      [c.id, c.first_name, c.last_name, c.email, c.state, c.created_at, c.updated_at]
    );
    console.log(`✅ Customer saved: ${c.first_name} ${c.last_name || ""}`);
  }
}

async function saveOrdersToDB(orders, connection) {
  for (const o of orders) {
    await connection.execute(
      `INSERT INTO orders (order_id, tenant_id, customer_id, total_price, status, created_at, updated_at)
       VALUES (?, 1, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE total_price = VALUES(total_price), status = VALUES(status), updated_at = VALUES(updated_at)`,
      [o.id, o.customer?.id || null, o.total_price, o.financial_status, o.created_at, o.updated_at]
    );
    console.log(`✅ Order saved: ${o.id}`);
  }
}

async function runIngestion() {
  const connection = await mysql.createConnection(dbConfig);

  const products = await fetchProducts();
  await saveProductsToDB(products, connection);

  const customers = await fetchCustomers();
  await saveCustomersToDB(customers, connection);

  const orders = await fetchOrders();
  await saveOrdersToDB(orders, connection);

  await connection.end();
  console.log("🎉 All data ingestion completed!");
}

runIngestion();
