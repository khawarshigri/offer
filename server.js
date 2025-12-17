require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// 1. --- CRITICAL CONNECTION FIX ---
// This allows Shopify to communicate with Railway without security blocks
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Access-Token'],
    credentials: true
}));

// This specifically handles the "Pre-flight" request browsers send
app.options('*', cors()); 

app.use(express.json());

const SHOP = process.env.SHOPIFY_STORE; 
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

// Health Check
app.get('/', (req, res) => {
    res.send("Bid API is Online and Running!");
});

// 2. --- CHECKOUT CREATION ROUTE ---
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
                        variant_id: Number(variantId), // Conversion to Number is required
                        quantity: 1,
                        price: bidAmount,
                        title: productTitle
                    }],
                    // These fields are REQUIRED to generate a 'checkoutUrl' (invoice_url)
                    use_customer_default_address: true,
                    email: "bidding-guest@example.com" 
                }
            }
        });

        const checkoutUrl = response.data.draft_order.invoice_url;

        if (checkoutUrl) {
            res.json({ success: true, checkoutUrl: checkoutUrl });
        } else {
            res.status(500).json({ success: false, message: "Shopify link not generated." });
        }

    } catch (error) {
        console.error('Detailed Error:', error.response ? JSON.stringify(error.response.data) : error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response ? error.response.data : "Internal Server Error" 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));