const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock external service that might fail under load or randomly
const processPayment = async (orderId, itemId, amount) => {
    // Simulate network call
    await delay(1000); 
    
    // Demonstrate a failure if the itemId is 'fail'
    // This allows students to easily simulate an external service outage
    if (itemId === 'fail') {
        throw new Error("Payment Gateway Timeout or Internal Error");
    }
    
    return { 
        success: true, 
        transactionId: `TXN-${Math.floor(Math.random() * 10000)}`,
        charged: amount
    };
};

module.exports = { processPayment };
