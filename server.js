require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Allow your specific Shopify domain
app.use(cors());

app.use(express.json());

const SHOP = process.env.SHOPIFY_STORE; 
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

// Health Check Route - Visit this in your browser to test
app.get('/', (req, res) => {
    res.send("Bid API is Online and Running!");
});

app.post('/create-bid-checkout', async (req, res) => {
    const { variantId, bidAmount, productTitle, variantTitle } = req.body;

    if (!variantId || !bidAmount) {
        return res.status(400).json({ success: false, message: 'Missing bid data' });
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
                        variant_id: variantId,
                        quantity: 1,
                        price: bidAmount,
                        title: productTitle,
                        properties: [{ name: "Order Type", value: "Accepted Bid" }]
                    }]
                }
            }
        });

        res.json({
            success: true,
            checkoutUrl: response.data.draft_order.invoice_url
        });

    } catch (error) {
        console.error('Shopify Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'Shopify API Error' });
    }
});

// Railway dynamic port binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server live on port ${PORT}`));