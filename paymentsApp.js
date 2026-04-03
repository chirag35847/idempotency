const express = require('express');
const app = express();

app.use(express.json());

app.post('/pay', (req, res) => {
    const { orderId, itemId, amount } = req.body;

    // Simulate network call delay
    setTimeout(() => {
        // Demonstrate a failure if the itemId is 'fail'
        if (itemId === 'fail') {
            return res.status(500).json({ 
                success: false, 
                error: "Payment Gateway Timeout or Internal Error" 
            });
        }
        
        res.json({ 
            success: true, 
            transactionId: `TXN-${Math.floor(Math.random() * 10000)}`,
            charged: amount
        });
    }, 1000);
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Payments service listening on port ${PORT}`);
});
