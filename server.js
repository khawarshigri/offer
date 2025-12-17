require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

const SHOP = process.env.SHOPIFY_STORE; 
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

app.get('/', (req, res) => {
    res.send("Bid API is Online and Running!");
});

app.post('/create-bid-checkout', async (req, res) => {
    const { variantId, bidAmount, productTitle } = req.body;

    // Safety check for variables
    if (!ADMIN_TOKEN || !SHOP) {
        console.error("CRITICAL ERROR: Environment variables are missing in Railway!");
        return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    try {
        const response = await axios({
            url: `https://${SHOP}/admin/api/2024-01/draft_orders.json`,
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': ADMIN_TOKEN,
                'Content-Type': 'application/json'
            },
            data: {
                draft_order: {
                    line_items: [{
                        // Shopify rejects variant IDs if they are sent as strings
                        variant_id: Number(variantId), 
                        quantity: 1,
                        price: bidAmount,
                        title: productTitle,
                        properties: [{ name: "Order Type", value: "Accepted Bid" }]
                    }],
                    // Required for creating a checkout URL
                    use_customer_default_address: true,
                    email: "bidding-customer@example.com" 
                }
            }
        });

        res.json({
            success: true,
            checkoutUrl: response.data.draft_order.invoice_url
        });

    } catch (error) {
        // This will print the exact reason (e.g., "Invalid Token") in Railway Logs
        if (error.response) {
            console.error('SHOPIFY ERROR DETAILS:', JSON.stringify(error.response.data));
            res.status(error.response.status).json({ 
                success: false, 
                message: error.response.data.errors || "Shopify API Error" 
            });
        } else {
            console.error('NETWORK ERROR:', error.message);
            res.status(500).json({ success: false, message: "Could not connect to Shopify" });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server live on port ${PORT}`));