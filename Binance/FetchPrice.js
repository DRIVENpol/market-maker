const axios = require('axios');

(async () => {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo?symbol=BNBBTC');
    const data = response.data;

    // The price is in the "price" field of the first object in the "symbols" array
    const price = data.symbols[0].price;

    console.log(price);
  } catch (error) {
    console.error(error);
  }
})();
