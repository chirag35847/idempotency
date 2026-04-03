const axios = require('axios');
const { logger } = require('../utils/logger');

const processPayment = async (orderId, itemId, amount, maxRetries = 3, timeoutMs = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(
                'http://localhost:4000/pay',
                { orderId, itemId, amount },
                { timeout: timeoutMs } // Axios handles timeouts much more cleanly!
            );

            return response.data;
        } catch (error) {
            const isTimeout = error.code === 'ECONNABORTED';
            const serverError = error.response?.data?.error;
            
            logger.warn(`Payment attempt ${attempt} failed: ${isTimeout ? 'Request Timed Out' : (serverError || error.message)}`);
            
            if (attempt === maxRetries) {
                throw new Error(isTimeout ? 'Payment Gateway Timeout (Max retries reached)' : (serverError || error.message));
            }
            
            // Optional: Delay between retries
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
    }
};

module.exports = { processPayment };
