const https = require('https');

const options = {
  hostname: 'api.kucoin.com',
  port: 443,
  path: '/api/v1/market/orderbook/level1?symbol=REV3L-USDT',
  method: 'GET'
};

https.get(options, (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    const response = JSON.parse(data);
    const price = response.data.price;
    console.log(`The current price of REV3L-USDT is: ${price}`);
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});




