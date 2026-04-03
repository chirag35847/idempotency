const { redisClient } = require('../config/redis');
const { getFeatureFlags } = require('../config/featureFlags');
const paymentCircuitBreaker = require('../config/circuitBreaker');

// Helper function to simulate order processing delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createOrder = async (req, res) => {
    const { itemId, quantity } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!itemId || !quantity) {
        return res.status(400).json({ error: "itemId and quantity are required" });
    }

    const { idempotency_enabled } = getFeatureFlags();

    // Step 1: Check Feature Flag
    if (!idempotency_enabled) {
        console.log("Idempotency is disabled. Processing request normally.");
        await delay(2000); // Simulate processing time
        const orderId = `ORD-${Math.floor(Math.random() * 1000000)}`;
        return res.status(201).json({ 
            message: "Order placed successfully", 
            orderId, 
            status: "CREATED" 
        });
    }

    if (!idempotencyKey) {
        return res.status(400).json({ error: "Idempotency-Key header is required when idempotency feature is enabled" });
    }

    console.log(`Processing order with Idempotency-Key: ${idempotencyKey}`);
    const lockKey = `lock:${idempotencyKey}`;
    const resultKey = `result:${idempotencyKey}`;

    try {
        // Step 2: Attempt to acquire lock.
        // NX: Set only if it does not exist.
        // EX: Set an expiration in seconds.
        const lockAcquired = await redisClient.set(lockKey, 'locked', {
            NX: true,
            EX: 15
        });

        if (!lockAcquired) {
            console.log(`Conflict! Request already processing for key: ${idempotencyKey}`);
            return res.status(409).json({ 
                error: "Conflict", 
                message: "A request with this idempotency key is already being processed." 
            });
        }

        console.log(`Lock acquired for key: ${idempotencyKey}. Checking for previous result.`);

        // Step 3: Check if result already exists from a previous successful request
        const cachedResult = await redisClient.get(resultKey);
        if (cachedResult) {
            console.log(`Result found in cache for key: ${idempotencyKey}. Returning cached response.`);
            
            // Release the lock before returning
            await redisClient.del(lockKey);
            
            return res.status(200).json({
                message: "Order previously processed",
                cached: true,
                ...JSON.parse(cachedResult)
            });
        }

        // Step 4: Process the actual business logic
        console.log(`No previous result found. Processing business logic for order...`);
        const orderId = `ORD-${Math.floor(Math.random() * 1000000)}`;

        console.log(`Calling Payment Gateway (Protected by Circuit Breaker) for order ${orderId}...`);
        
        // --- CIRCUIT BREAKER IN ACTION ---
        const amount = quantity * 10; 
        const paymentResult = await paymentCircuitBreaker.fire(orderId, itemId, amount);

        if (!paymentResult.success) {
            console.log(`Order ${orderId} failed due to downstream issues. Releasing lock so user can retry later.`);
            // Do NOT save an idempotency result, because the order technically wasn't placed.
            // Release the lock so the user can retry.
            await redisClient.del(lockKey); 
            
            return res.status(503).json({
                error: "ServiceUnavailable",
                message: paymentResult.error,
                circuitBreakerStatus: paymentCircuitBreaker.opened ? "OPEN" : "CLOSED"
            });
        }

        // Additional simulated delay so students can notice concurrent requests being blocked by Idempotency Lock
        await delay(3000); 
        
        const orderResponse = {
            orderId,
            status: "CREATED",
            itemId,
            quantity,
            payment: paymentResult
        };

        // Step 5: Save the result for future identical requests
        // Keep result for 24 hours
        await redisClient.set(resultKey, JSON.stringify(orderResponse), {
            EX: 86400 
        });

        console.log(`Business logic completed. Response saved for key: ${idempotencyKey}.`);

        // Step 6: Release the lock
        await redisClient.del(lockKey);
        console.log(`Lock released for key: ${idempotencyKey}.`);

        return res.status(201).json({
            message: "Order placed successfully",
            cached: false,
            ...orderResponse
        });

    } catch (err) {
        console.error("Error processing order:", err);
        // Ensure lock is released on error 
        await redisClient.del(lockKey).catch(console.error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { createOrder };
