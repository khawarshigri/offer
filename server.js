require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// FIX 1: Explicitly allow your Shopify domain to prevent browser blocks
app.use(cors({
    origin: ['https://nr1mrt-5a.myshopify.com',"https://admin.shopify.com"], 
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const SHOP = process.env.SHOPIFY_STORE; 
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

app.post('/create-bid-checkout', async (req, res) => {
    const { variantId, bidAmount, productTitle, variantTitle } = req.body;

    // FIX 2: Basic validation to prevent server crashes on empty bodies
    if (!variantId || !bidAmount) {
        return res.status(400).json({ success: false, message: 'Missing required bid data' });
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
                    line_items: [
                        {
                            variant_id: variantId,
                            quantity: 1,
                            price: bidAmount,
                            title: productTitle,
                            properties: [
                                { name: "Order Type", value: "Accepted Bid" }
                            ]
                        }
                    ],
                    // Automatically mark as "Pending" so the checkout link works
                    use_customer_default_address: true
                }
            }
        });

        const checkoutUrl = response.data.draft_order.invoice_url;
        
        res.json({
            success: true,
            checkoutUrl: checkoutUrl,
            message: 'Bid finalized! Redirecting to checkout...'
        });

    } catch (error) {
        // Detailed logging for Railway dashboard
        console.error('Shopify API Error Detail:', error.response ? JSON.stringify(error.response.data) : error.message);
        res.status(500).json({ success: false, message: 'Shopify API rejected the request' });
    }
});

// FIX 3: Use the dynamic port provided by Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Bidding Server running on port ${PORT}`));