const axios = require("axios");
const mysql = require("mysql2/promise");

// ------------------------
// Database configuration
// ------------------------
const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "shopify_data",
};

// ------------------------
// Shopify store and token
// ------------------------
const SHOP = "hema-fde-test-store.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// ------------------------
// Helper function: fetch all pages via cursor pagination
// ------------------------
async function fetchAllPages(url) {
  let results = [];
  let nextPageUrl = url;

  while (nextPageUrl) {
    const res = await axios.get(nextPageUrl, {
      headers: { "X-Shopify-Access-Token": TOKEN },
    });

    const key = Object.keys(res.data)[0];
    results.push(...(res.data[key] || []));

    // Check for pagination link
    const linkHeader = res.headers.link;
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextPageUrl = matches ? matches[1] : null;
    } else {
      nextPageUrl = null;
    }
  }

  return results;
}

// ------------------------
// Generic fetch and save
// ------------------------
async function fetchAndSave(url, table, mapFn, connection) {
  try {
    const items = await fetchAllPages(url);

    if (!items.length) return console.log(`No ${table} found.`);

    for (const item of items) {
      const { query, values } = mapFn(item);
      await connection.execute(query, values);
      console.log(`✅ ${table.slice(0, -1)} saved: ${item.id || item.title || item.first_name}`);
    }
  } catch (err) {
    console.error(`Error fetching ${table}:`, err.response?.data || err.message);
  }
}

// ------------------------
// Main ingestion function
// ------------------------
async function ingestShopifyData() {
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Connected to MySQL database");

    // ------------------------
    // Products
    // ------------------------
    await fetchAndSave(
      `https://${SHOP}/admin/api/2025-01/products.json?limit=50`,
      "products",
      (p) => ({
        query: `
          INSERT INTO products 
            (product_id, title, vendor, product_type, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title=VALUES(title), vendor=VALUES(vendor), product_type=VALUES(product_type),
            status=VALUES(status), updated_at=VALUES(updated_at)
        `,
        values: [p.id, p.title, p.vendor, p.product_type, p.status, p.created_at, p.updated_at],
      }),
      connection
    );

    // ------------------------
    // Customers
    // ------------------------
    await fetchAndSave(
      `https://${SHOP}/admin/api/2025-01/customers.json?limit=50`,
      "customers",
      (c) => ({
        query: `
          INSERT INTO customers 
            (customer_id, first_name, last_name, email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            first_name=VALUES(first_name), last_name=VALUES(last_name), email=VALUES(email),
            updated_at=VALUES(updated_at)
        `,
        values: [c.id, c.first_name, c.last_name, c.email, c.created_at, c.updated_at],
      }),
      connection
    );

    // ------------------------
    // Orders
    // ------------------------
    await fetchAndSave(
      `https://${SHOP}/admin/api/2025-01/orders.json?limit=50`,
      "orders",
      (o) => ({
        query: `
          INSERT INTO orders
            (order_id, customer_id, total_price, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            total_price=VALUES(total_price), status=VALUES(status), updated_at=VALUES(updated_at)
        `,
        values: [o.id, o.customer?.id || null, o.total_price, o.financial_status, o.created_at, o.updated_at],
      }),
      connection
    );

    console.log("\n🎉 Shopify data ingestion completed successfully!");
  } catch (err) {
    console.error("❌ MySQL connection error:", err.message);
  } finally {
    if (connection) await connection.end();
  }
}

// Run the script
ingestShopifyData();
