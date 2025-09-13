const fetch = require("node-fetch");

// Replace with your store and API token
const SHOP = "hema-fde-test-store.myshopify.com";
const TOKEN = "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";

// List of products with placeholders
const products = [
  {
    id: 8647469826100,
    title: "Product 1",
    imageUrl: "https://your-image-url.com/product1.jpg",
    collection: "Category A",
    trackInventory: true,
    status: "active",
    tags: ["tag1", "tag2"]
  },
  {
    id: 8647469858868,
    title: "Product 2",
    imageUrl: "https://your-image-url.com/product2.jpg",
    collection: "Category B",
    trackInventory: true,
    status: "active",
    tags: ["tag3"]
  },
  // Add all your other products here
];

// Function to add an image to a product
async function addImage(product) {
  try {
    const response = await fetch(`https://${SHOP}/admin/api/2025-01/products/${product.id}/images.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ image: { src: product.imageUrl } }),
    });
    const data = await response.json();
    if (data.errors) console.error("Error adding image for product ID", product.id, data.errors);
    else console.log("Image added for product ID:", product.id);
  } catch (err) {
    console.error("Request failed for product ID", product.id, err);
  }
}

// Function to create a collection (if not exists) and assign product
async function assignCollection(product) {
  try {
    // Create collection
    const colResponse = await fetch(`https://${SHOP}/admin/api/2025-01/custom_collections.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ custom_collection: { title: product.collection, published: true } }),
    });
    const colData = await colResponse.json();
    const collectionId = colData.custom_collection?.id;
    if (!collectionId) return console.log("Collection already exists or error for:", product.collection);

    // Assign product to collection
    await fetch(`https://${SHOP}/admin/api/2025-01/collects.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ collect: { product_id: product.id, collection_id: collectionId } }),
    });
    console.log(`Product ID ${product.id} assigned to collection: ${product.collection}`);
  } catch (err) {
    console.error("Collection assignment failed for product ID", product.id, err);
  }
}

// Function to update inventory tracking & status
async function updateInventoryStatus(product) {
  try {
    await fetch(`https://${SHOP}/admin/api/2025-01/products/${product.id}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({
        product: {
          id: product.id,
          status: product.status,
          variants: [{ inventory_management: product.trackInventory ? "shopify" : "none" }]
        }
      }),
    });
    console.log(`Updated inventory & status for product ID: ${product.id}`);
  } catch (err) {
    console.error("Inventory/status update failed for product ID", product.id, err);
  }
}

// Function to add tags
async function addTags(product) {
  try {
    await fetch(`https://${SHOP}/admin/api/2025-01/products/${product.id}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({
        product: { id: product.id, tags: product.tags.join(", ") }
      }),
    });
    console.log(`Tags added for product ID: ${product.id}`);
  } catch (err) {
    console.error("Failed to add tags for product ID", product.id, err);
  }
}

// Main function
async function setupProducts() {
  for (const product of products) {
    await addImage(product);
    await assignCollection(product);
    await updateInventoryStatus(product);
    await addTags(product);
  }
}

setupProducts();
