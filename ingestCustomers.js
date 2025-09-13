const axios = require("axios");
const mysql = require("mysql2/promise");

const SHOP = "hema-fde-test-store.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function fetchCustomers() {
  try {
    const response = await axios.get(`https://${SHOP}/admin/api/2025-01/customers.json`, {
      headers: {
        "X-Shopify-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    });
    return response.data.customers;
  } catch (err) {
    console.error("Error fetching customers:", err.response?.data || err.message);
    return [];
  }
}

async function saveCustomersToDB(customers) {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "shopify_data",
  });

  for (const c of customers) {
    try {
      await connection.execute(
        `INSERT INTO customers (customer_id, tenant_id, first_name, last_name, email, created_at, updated_at)
         VALUES (?, 1, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         email = VALUES(email),
         updated_at = VALUES(updated_at)`,
        [c.id, c.first_name, c.last_name, c.email, c.created_at, c.updated_at]
      );
      console.log("✅ Customer saved:", c.first_name, c.last_name);
    } catch (err) {
      console.error("Error saving customer:", err.message);
    }
  }
  await connection.end();
}

async function ingestCustomers() {
  const customers = await fetchCustomers();
  if (customers.length === 0) {
    console.log("No customers found.");
    return;
  }
  await saveCustomersToDB(customers);
}

ingestCustomers();
