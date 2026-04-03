const CircuitBreaker = require('opossum');
const { processPayment } = require('../services/paymentService');
const { logger } = require('../utils/logger');

const options = {
    timeout: 3000,               // If function takes longer than 3 seconds, it's a failure
    errorThresholdPercentage: 50, // If 50% of requests fail, trip (open) the circuit
    resetTimeout: 10000          // Wait 10 seconds before transitioning to HALF-OPEN to test recovery
};

const paymentCircuitBreaker = new CircuitBreaker(processPayment, options);

// Listen to events for demonstration purposes in the console
paymentCircuitBreaker.on('open', () => {
    logger.warn('\n[🛑 CIRCUIT BREAKER] State changed to OPEN! \nExternal service failing. Further requests will be blocked immediately (Fail Fast).\n');
});
paymentCircuitBreaker.on('halfOpen', () => {
    logger.warn('\n[⚠️ CIRCUIT BREAKER] State changed to HALF-OPEN! \nTesting if external service is back online with the next request...\n');
});
paymentCircuitBreaker.on('close', () => {
    logger.info('\n[✅ CIRCUIT BREAKER] State changed to CLOSED! \nService resumed normally.\n');
});
paymentCircuitBreaker.on('fallback', () => {
    logger.info('[🛡️ CIRCUIT BREAKER] Fallback action executed.');
});

// Optional fallback function - what to return when circuit is open or function fails
paymentCircuitBreaker.fallback(() => {
    return { 
        success: false, 
        error: "Payment service is currently unavailable or the circuit is OPEN. Please try again later." 
    };
});

module.exports = paymentCircuitBreaker;
