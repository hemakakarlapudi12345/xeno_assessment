const axios = require("axios");

// Replace with your store and API token
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
    console.log("Products ingested:", response.data.products.length);
    console.log(response.data.products); // Logs product details
  } catch (err) {
    console.error("Product ingestion failed:", err.response?.data || err.message);
  }
}

fetchProducts();
