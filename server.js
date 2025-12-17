require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// 1. OPEN CORS (Allows Shopify to talk to Railway)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const SHOP = process.env.SHOPIFY_STORE; 
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

app.get('/', (req, res) => res.send("Bid API is Online!"));

app.post('/create-bid-checkout', async (req, res) => {
    const { variantId, bidAmount, productTitle } = req.body;

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
                        variant_id: Number(variantId), // Must be a Number
                        quantity: 1,
                        price: bidAmount,
                        title: productTitle
                    }],
                    // REQUIRED to generate the checkout link
                    use_customer_default_address: true,
                    email: "bidding-guest@example.com" 
                }
            }
        });

        // The checkout link is located here:
        const checkoutUrl = response.data.draft_order.invoice_url;

        if (checkoutUrl) {
            res.json({ success: true, checkoutUrl: checkoutUrl });
        } else {
            res.status(500).json({ success: false, message: "Shopify link generation failed." });
        }

    } catch (error) {
        console.error('SHOPIFY ERROR:', error.response ? JSON.stringify(error.response.data) : error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server live on port ${PORT}`));