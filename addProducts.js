const fetch = require("node-fetch");

// Replace with your store and API token
const SHOP = "hema-fde-test-store.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;


// Add all your PDF products here


const products = [
  { title: "Product 1", price: 0, inventory: 2 },
  { title: "Product 2", price: 0, inventory: 2 },
  { title: "Product 3", price: 0, inventory: 2 },
  { title: "Test Product", price: 0, inventory: 2 },
  { title: "Book", price: 0, inventory: -1 },
  { title: "Bottle", price: 0, inventory: 0 },
  { title: "Test chair", price: 0, inventory: 0 },
];


async function createProduct(title, price, inventory) {
  try {
    const response = await fetch(`https://${SHOP}/admin/api/2025-01/products.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({
        product: {
          title: title,
          variants: [{ price: price, inventory_quantity: inventory }]
        }
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error("Error creating product:", data.errors);
    } else {
      console.log("Product created:", data.product.title, "| ID:", data.product.id);
    }
  } catch (err) {
    console.error("Request failed:", err);
  }
}

// Loop through all products and create them
products.forEach(p => createProduct(p.title, p.price, p.inventory));
