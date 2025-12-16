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

app.post('/add-bid', (req, res) => {
  const { productId, bidAmount } = req.body;

  if (!productId || !bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid productId or bidAmount' });
  }

  // Save bid
  bids[productId] = { bidAmount };

  // You can add additional logic here, e.g., check minimum bid, approve/reject, etc.

  res.json({
    success: true,
    acceptedBid: bidAmount,
    message: 'Bid accepted successfully!'
  });
});
app.listen(3000, () => console.log('Server running on port 3000'));
