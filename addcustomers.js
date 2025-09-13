require('dotenv').config();
const Database = require('better-sqlite3');
const axios = require('axios');

// Shopify API details
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN;

// Debug: check token and store domain
console.log("Shopify Token:", SHOPIFY_API_TOKEN);
console.log("Shopify Store:", SHOPIFY_STORE_DOMAIN);

// Connect to SQLite database
const db = new Database(process.env.DB_STORAGE);

async function addCustomersToShopify() {
  try {
    // Fetch customers with valid emails only
    const customers = db.prepare("SELECT * FROM customers WHERE email IS NOT NULL").all();
    console.log(`Found ${customers.length} customers in SQLite.`);

    for (const customer of customers) {
      const data = {
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          verified_email: true,
          state: customer.state || undefined,
          city: customer.city || undefined,
          province: customer.province || undefined,
          country: customer.country || undefined,
          zip: customer.zip || undefined,
        }
      };

      try {
        const response = await axios.post(
          `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-07/customers.json`,
          data,
          {
            headers: {
              "X-Shopify-Access-Token": SHOPIFY_API_TOKEN,
              "Content-Type": "application/json"
            }
          }
        );
        console.log(`Added customer: ${customer.first_name} ${customer.last_name} (${customer.email})`);
      } catch (shopifyError) {
        console.error(`Failed to add ${customer.email}:`, shopifyError.response?.data || shopifyError.message);
      }
    }

    console.log("All customers processed.");
  } catch (err) {
    console.error("Database error:", err);
  }
}

// Run the function
addCustomersToShopify();
