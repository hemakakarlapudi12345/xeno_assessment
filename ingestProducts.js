const axios = require("axios");
const mysql = require("mysql2/promise");

const SHOP = "hema-fde-test-store.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function fetchProducts() {
  try {
    const response = await axios.get(`https://${SHOP}/admin/api/2025-01/products.json`, {
      headers: {
        "X-Shopify-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    });
    return response.data.products;
  } catch (err) {
    console.error("Error fetching products:", err.response?.data || err.message);
    return [];
  }
}

async function saveProductsToDB(products) {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // set your MySQL password
    database: "shopify_data",
  });

  for (const p of products) {
    try {
      await connection.execute(
        `INSERT INTO products (product_id, tenant_id, title, status, created_at, updated_at) 
         VALUES (?, 1, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         status = VALUES(status),
         updated_at = VALUES(updated_at)`,
        [p.id, p.title, p.status, p.created_at, p.updated_at]
      );
      console.log("✅ Product saved:", p.title);
    } catch (err) {
      console.error("Error saving product:", err.message);
    }
  }
  await connection.end();
}

async function ingestProducts() {
  const products = await fetchProducts();
  if (products.length === 0) {
    console.log("No products found.");
    return;
  }
  await saveProductsToDB(products);
}

ingestProducts();
