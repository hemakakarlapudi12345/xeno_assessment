// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Routes and middleware
const authRoutes = require('./routes/auth');            // Authentication routes
const authenticateToken = require('./middleware/auth'); // Auth middleware
const pool = require('./db');                           // MySQL connection pool

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Shopify Dashboard Backend Running');
});

// ===============================
// Dashboard API Routes
// ===============================

// Metrics: total customers, total orders, total revenue
app.get('/api/dashboard/metrics', authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.query(
      'SELECT COUNT(*) AS total_customers FROM customers'
    );
    const [orders] = await pool.query(
      `SELECT COUNT(*) AS total_orders,
              SUM(total_price) AS total_revenue
       FROM orders
       WHERE status IN ('completed','paid')`
    );

    res.json({
      totalCustomers: customers[0].total_customers,
      totalOrders: orders[0].total_orders,
      totalRevenue: orders[0].total_revenue || 0
    });
  } catch (err) {
    console.error('❌ Error fetching metrics:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Orders by date
app.get('/api/dashboard/orders', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE(created_at) AS order_date,
             COUNT(*) AS orders_count,
             SUM(total_price) AS revenue
      FROM orders
      WHERE status IN ('completed','paid')
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching orders by date:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// -------------------------------
// Top 5 customers by spend
// -------------------------------
app.get('/api/dashboard/top-customers', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.customer_id,
             c.first_name,
             c.last_name,
             c.email AS customer_email,
             c.city,
             c.state,
             SUM(IFNULL(o.total_price,0)) AS total_spent
      FROM customers c
      JOIN orders o ON c.customer_id = o.customer_id
      WHERE o.status IN ('completed','paid')
      GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.city, c.state
      ORDER BY total_spent DESC
      LIMIT 5
    `);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching top customers:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
