require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Shopify Storefront settings
const SHOP = process.env.SHOPIFY_STORE; // e.g., 'nr1mrt-5a.myshopify.com'
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN; // Storefront access token

// Endpoint to add bid to cart
app.post('/add-bid', async (req, res) => {
  const { variantId, quantity, bidAmount } = req.body;

  try {
    const mutation = `
      mutation cartCreate($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart {
            id
            lines(first: 10) {
              edges {
                node {
                  id
                  quantity
                  attributes {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      lines: [
        {
          merchandiseId: variantId,
          quantity,
          attributes: { "Accepted Bid Price": bidAmount.toString() }
        }
      ]
    };

    const response = await axios.post(
      `https://${SHOP}/api/2025-07/graphql.json`,
      { query: mutation, variables },
      {
        headers: {
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to add bid' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
