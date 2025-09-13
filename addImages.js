const fetch = require("node-fetch");

// Replace with your store and API token
const SHOP = "hema-fde-test-store.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;


// List of products with their Shopify Product IDs and image URLs
const productsWithImages = [
  { id: 8647469826100, imageUrl: "https://example.com/images/product1.jpg" },
  { id: 8647469858868, imageUrl: "https://example.com/images/product2.jpg" },
  { id: 8647469891636, imageUrl: "https://example.com/images/product3.jpg" },
  { id: 8647000883252, imageUrl: "https://example.com/images/book.jpg" },
  { id: 8647000031284, imageUrl: "https://example.com/images/bottle.jpg" },
  { id: 8646995443764, imageUrl: "https://example.com/images/chair.jpg" },
  { id: 8647469465652, imageUrl: "https://example.com/images/test-product.jpg" },
];

async function addProductImage(productId, imageUrl) {
  try {
    const response = await fetch(`https://${SHOP}/admin/api/2025-01/products/${productId}/images.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({
        image: { src: imageUrl }
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error(`Error adding image for product ID ${productId}:`, data.errors);
    } else {
      console.log(`Image added for product ID: ${productId}`);
    }
  } catch (err) {
    console.error("Request failed:", err);
  }
}

// Loop through all products and add their images
productsWithImages.forEach(p => addProductImage(p.id, p.imageUrl));
