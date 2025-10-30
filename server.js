const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
console.log("✅ expenseRoutes loaded");

const expenseRoutes = require("./routes/expenseRoutes.js");
app.use("/api/expenses", expenseRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Test route
app.get("/", (req, res) => {
  res.send("Expense Tracker Backend Running 🚀");
});

app.get("/test", (req, res) => {
  res.send("✅ Server test route working!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
