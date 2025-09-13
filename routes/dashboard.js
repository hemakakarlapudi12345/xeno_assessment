const express = require("express");
const { Sequelize } = require("sequelize");
const Customer = require("../models/Customer");
const Order = require("../models/Order");

const router = express.Router();

// -------- Dashboard Metrics --------
router.get("/metrics", async (req, res) => {
  try {
    const totalCustomers = await Customer.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum("total_price", {
      where: { status: ["completed", "paid"] }, // only paid/completed
    });

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenue || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------- Orders Trend (Revenue Over Time) --------
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("created_at")), "order_date"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "orders_count"],
        [Sequelize.fn("SUM", Sequelize.col("total_price")), "revenue"],
      ],
      where: { status: ["completed", "paid"] },
      group: [Sequelize.fn("DATE", Sequelize.col("created_at"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("created_at")), "ASC"]],
      raw: true,
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------- Top Customers --------
router.get("/top-customers", async (req, res) => {
  try {
    const customers = await Order.findAll({
      attributes: [
        "customer_id",
        [Sequelize.fn("SUM", Sequelize.col("total_price")), "total_spent"],
      ],
      where: { status: ["completed", "paid"] },
      group: ["customer_id"],
      order: [[Sequelize.fn("SUM", Sequelize.col("total_price")), "DESC"]],
      limit: 5,
      raw: true,
    });

    // Join with customer info
    const customerIds = customers.map((c) => c.customer_id);
    const customerData = await Customer.findAll({
      where: { customer_id: customerIds },
      raw: true,
    });

    const result = customers.map((c) => {
      const info = customerData.find((cust) => cust.customer_id == c.customer_id);
      return {
        customer_id: c.customer_id,
        first_name: info?.first_name || "",
        last_name: info?.last_name || "",
        email: info?.email || "",
        city: info?.city || "-",
        state: info?.state || "-",
        total_spent: parseFloat(c.total_spent || 0),
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
