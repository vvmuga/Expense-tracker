const express = require("express");
const router = express.Router();
const Expense = require("../models/expense");

router.get("/test", (req, res) => {
  res.send("✅ Expense routes working");
});

// GET all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST (add) a new expense
router.post("/", async (req, res) => {
  try {
    const expense = new Expense({
      description: req.body.description,
      amount: req.body.amount,
    });
    const savedExpense = await expense.save();
    res.json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
