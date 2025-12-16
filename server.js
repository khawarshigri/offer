require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const SHOP = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

// Example endpoint: Add custom bid to cart
app.post('/add-bid', async (req, res) => {
  const { variantId, quantity, bidAmount } = req.body;

  try {
    const response = await axios.post(
      `https://${SHOP}/admin/api/2025-07/carts.json`,
      {
        cart: {
          lines: [
            {
              quantity,
              merchandise_id: variantId,
              properties: { "Accepted Bid Price": bidAmount }
            }
          ]
        }
      },
      { headers: { 'X-Shopify-Access-Token': TOKEN } }
    );
    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to add bid' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
