require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// 1. UPDATED CORS: This allows Shopify to talk to Railway without security blocks
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Shopify-Access-Token']
}));

app.use(express.json());

const SHOP = process.env.SHOPIFY_STORE; 
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

app.get('/', (req, res) => {
    res.send("Bid API is Online and Running!");
});

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
                        variant_id: Number(variantId), 
                        quantity: 1,
                        price: bidAmount,
                        title: productTitle
                    }],
                    use_customer_default_address: true,
                    email: "bidding-customer@example.com" 
                }
            }
        });

        // Ensure we send back the invoice_url correctly
        const checkoutUrl = response.data.draft_order.invoice_url;
        res.json({ success: true, checkoutUrl: checkoutUrl });

    } catch (error) {
        console.error('SHOPIFY ERROR:', error.response ? JSON.stringify(error.response.data) : error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response ? error.response.data.errors : "Shopify API Error" 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server live on port ${PORT}`));