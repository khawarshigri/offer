require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Enable CORS so your Shopify store can talk to this server
app.use(cors());
app.use(express.json());

// Load variables
const SHOP = process.env.SHOPIFY_STORE; 
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

app.get('/', (req, res) => {
    res.send("Bid API is Online!");
});

app.post('/create-bid-checkout', async (req, res) => {
    const { variantId, bidAmount, productTitle } = req.body;

    if (!variantId || !bidAmount) {
        return res.status(400).json({ success: false, message: 'Missing bid data' });
    }

    try {
        console.log(`Creating order for Variant: ${variantId} at Price: ${bidAmount}`);

        const response = await axios({
            url: `https://${SHOP}/admin/api/2024-01/draft_orders.json`,
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': ADMIN_TOKEN, // Must be the shpat_ token
                'Content-Type': 'application/json'
            },
            data: {
                draft_order: {
                    line_items: [{
                        // FIX 1: Convert ID to Number (Crucial!)
                        variant_id: Number(variantId),
                        quantity: 1,
                        price: bidAmount,
                        title: productTitle,
                        properties: [{ name: "Order Type", value: "Accepted Bid" }]
                    }],
                    // FIX 2: Shopify NEEDS an email to generate an invoice URL often
                    email: "guest@example.com", 
                    use_customer_default_address: true
                }
            }
        });

        // Send the checkout URL back to the frontend
        res.json({
            success: true,
            checkoutUrl: response.data.draft_order.invoice_url
        });

    } catch (error) {
        // Log the EXACT error from Shopify to Railway logs
        console.error('Shopify API Error Dump:', error.response ? JSON.stringify(error.response.data) : error.message);
        
        const errorMsg = error.response ? JSON.stringify(error.response.data.errors) : "Connection to Shopify failed";
        res.status(500).json({ success: false, message: errorMsg });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server live on port ${PORT}`));