const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./src/config/db');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Health check route (không cần database)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
});

// Start server with database connection
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Connect to database first
        await connectDB();
        console.log('Database connected successfully');

        // Load routes after database connection
        app.use('/api/payments', require('./src/routes/paymentRoutes'));
        app.use('/api/notifications', require('./src/routes/notificationRoutes'));

        // Then start the server
        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Only start server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = app; 