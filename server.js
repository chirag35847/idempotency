const express = require('express');
const { connectRedis } = require('./config/redis');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Middlewares
app.use(express.json());

// Routes
app.use('/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

const startServer = async () => {
    try {
        await connectRedis();
        
        const PORT = 3000;
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
            console.log(`Idempotency API: POST http://localhost:${PORT}/api/orders`);
            console.log(`Toggle Feature flag: POST http://localhost:${PORT}/admin/feature-flags`);
        });
    } catch (error) {
        console.error("Failed to start server", error);
    }
};

startServer();
