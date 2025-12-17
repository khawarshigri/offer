require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SHOP = process.env.SHOPIFY_STORE; 
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

app.post('/create-bid-checkout', async (req, res) => {
    const { variantId, bidAmount, productTitle } = req.body;

    try {
        const response = await axios({
            url: `https://${SHOP}/admin/api/2024-01/draft_orders.json`,
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': ADMIN_TOKEN, // This MUST be the shpat_ token
                'Content-Type': 'application/json'
            },
            data: {
                draft_order: {
                    line_items: [{
                        variant_id: parseInt(variantId), // Ensures ID is a number
                        quantity: 1,
                        price: bidAmount,
                        title: productTitle
                    }],
                    use_customer_default_address: true,
                    email: "guest@example.com" // Required for checkout link generation
                }
            }
        });

        res.json({ success: true, checkoutUrl: response.data.draft_order.invoice_url });

    } catch (error) {
        console.error("Shopify Error:", error.response ? error.response.data : error.message);
        // This passes the exact error back to your browser alert
        res.status(500).json({ 
            success: false, 
            message: error.response ? JSON.stringify(error.response.data) : "Server Connection Error" 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));