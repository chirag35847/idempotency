const { createClient } = require('redis');

const redisClient = createClient({ url: 'redis://localhost:6379' });

redisClient.on('error', (err) => console.error('Redis Client Error', err));

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis...");
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }
};

module.exports = { redisClient, connectRedis };
