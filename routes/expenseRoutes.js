// In expenseRoutes.js
const express = require('express');
const router = express.Router();
const Expense = require('../models/expense');

// Validation middleware
const validateExpense = (req, res, next) => {
    const { description, amount, date } = req.body;
    
    if (!description || description.trim().length === 0) {
        return res.status(400).json({ message: 'Description is required' });
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    if (date && isNaN(new Date(date).getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Sanitize input
    req.body.description = description.trim();
    req.body.amount = parseFloat(amount);
    req.body.date = date ? new Date(date) : new Date();
    
    next();
};

// GET all expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Failed to fetch expenses' });
    }
});

// GET single expense by ID
router.get('/:id', async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid expense ID' });
        }
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            res.json(expense);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({ message: 'Failed to fetch expense' });
    }
});

// POST new expense
router.post('/', validateExpense, async (req, res) => {
    try {
        const expense = new Expense({
            description: req.body.description,
            amount: req.body.amount,
            date: req.body.date
        });
        
        const newExpense = await expense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(400).json({ message: 'Failed to create expense' });
    }
});

// UPDATE expense
router.put('/:id', validateExpense, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid expense ID' });
        }
        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            {
                description: req.body.description,
                amount: req.body.amount,
                date: req.body.date
            },
            { new: true }
        );
        if (expense) {
            res.json(expense);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(400).json({ message: 'Failed to update expense' });
    }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid expense ID' });
        }
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (expense) {
            res.json({ message: 'Expense deleted' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Failed to delete expense' });
    }
});

module.exports = router;

