const axios = require('axios');

const baseURL = 'https://api.kucoin.com';
const apiKey = 'YOUR_API_KEY';
const apiSecret = 'YOUR_API_SECRET';
const symbol = 'BTC-USDT'; // the symbol for the trading pair
const type = 'BUY'; // the type of order (BUY or SELL)
const price = 10000; // the price per unit
const amount = 1; // the number of units to buy or sell

// create the request body
const body = {
  symbol,
  type,
  price,
  amount
};

// create the request headers
const timestamp = Date.now();
const headers = {
  'KC-API-KEY': apiKey,
  'KC-API-TIMESTAMP': timestamp,
  'KC-API-PASSPHRASE': 'YOUR_API_PASSPHRASE'
};

// create the signature for the request
const signature = createSignature(apiSecret, 'POST', '/api/v1/orders', body, timestamp);
headers['KC-API-SIGN'] = signature;

// make the request to the Kucoin API
axios
  .post(`${baseURL}/api/v1/orders`, body, { headers })
  .then(response => {
    // handle the response
    const order = response.data;
    console.log(order);
  })
  .catch(error => {
    // handle the error
    console.error(error);
  });

// creates the signature for a Kucoin API request
function createSignature(apiSecret, method, path, body, timestamp) {
  const message = timestamp + method + path + JSON.stringify(body);
  const hash = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');
  return hash;
}
