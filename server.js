require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURATION
const SHOP = process.env.SHOPIFY_STORE; // e.g., 'your-store.myshopify.com'
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN; // Admin API Password/Token

app.post('/create-bid-checkout', async (req, res) => {
    const { variantId, bidAmount, productTitle, variantTitle } = req.body;

    try {
        // 1. Create a Draft Order in Shopify with the CUSTOM price
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
                            price: bidAmount, // This is where the magic happens
                            title: productTitle,
                            properties: [
                                { name: "Order Type", value: "Accepted Bid" }
                            ]
                        }
                    ],
                    applied_discount: {
                        description: "Negotiated Bid Price",
                        value_type: "fixed_amount",
                        value: 0 // We set price directly, so no discount needed
                    }
                }
            }
        });

        // 2. Send the Invoice/Checkout URL back to the frontend
        const checkoutUrl = response.data.draft_order.invoice_url;
        
        res.json({
            success: true,
            checkoutUrl: checkoutUrl,
            message: 'Bid finalized! Redirecting to checkout...'
        });

    } catch (error) {
        console.error('Shopify API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'Failed to create checkout' });
    }
});

app.listen(3000, () => console.log('Bidding Server running on port 3000'));