const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const expenseRoutes = require('./routes/expenseRoutes');
require('dotenv').config();

const app = express();

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());

// Use env var or fallback to IPv4 localhost to avoid ::1 issues on Windows
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense-tracker';

let connectAttempts = 0;
const MAX_ATTEMPTS = 10;

// MongoDB connection with retry logic
const connectDB = async () => {
	// Exponential backoff with cap
	const backoffMs = Math.min(1000 * Math.pow(2, connectAttempts), 30000);
	try {
		await mongoose.connect(MONGO_URI); // no deprecated options
		console.log('MongoDB Connected Successfully');
		connectAttempts = 0; // reset attempts after success
	} catch (error) {
		connectAttempts += 1;
		console.error('MongoDB Connection Error:', error.message || error);
		if (connectAttempts >= MAX_ATTEMPTS) {
			console.error(
				`Failed to connect to MongoDB after ${connectAttempts} attempts.\n` +
				'Make sure MongoDB is running locally (windows: run "net start MongoDB" or start the mongod service),\n' +
				'or set MONGO_URI to point to your Atlas/remote instance.'
			);
			// Do not exit automatically; keep server running but DB operations will fail until DB is available.
			return;
		}
		console.log(`Retrying MongoDB connection in ${Math.round(backoffMs / 1000)}s (attempt ${connectAttempts}/${MAX_ATTEMPTS})...`);
		setTimeout(connectDB, backoffMs);
	}
};

connectDB();

// Listen for connection state changes (optional helpful logs)
mongoose.connection.on('connected', () => {
	console.log('Mongoose event: connected');
});
mongoose.connection.on('disconnected', () => {
	console.warn('MongoDB Disconnected. Attempting to reconnect...');
	// connectDB() will be retried by our logic only when connectDB triggers again;
	// ensure we attempt reconnect if disconnected unexpectedly
	if (connectAttempts < MAX_ATTEMPTS) {
		setTimeout(connectDB, 1000);
	}
});
mongoose.connection.on('error', (err) => {
	console.error('MongoDB Error event:', err);
});

// Routes
app.use('/api/expenses', expenseRoutes);

// Health endpoint: reports app uptime and MongoDB connection state
app.get('/health', (req, res) => {
	// mongoose.connection.readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
	const stateMap = {
		0: 'disconnected',
		1: 'connected',
		2: 'connecting',
		3: 'disconnecting'
	};
	const dbState = stateMap[mongoose.connection.readyState] || 'unknown';
	res.json({
		status: 'ok',
		uptime: process.uptime(),
		db: dbState,
		timestamp: Date.now()
	});
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
	console.error('Server Error:', err);
	res.status(500).json({
		message: 'Internal server error',
		error: process.env.NODE_ENV === 'development' ? err.message : undefined
	});
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received. Shutting down gracefully...');
	server.close(() => {
		mongoose.connection.close(false, () => {
			console.log('MongoDB connection closed.');
			process.exit(0);
		});
	});
});