// TO DO LIST 
// 1) BUY/SELL FOR ETH 
// 2) BUY/SELL FOR TOKENS [x]
// 3) CONNECT TO KUCOIN API + READ/WRITE

const ethers = require('ethers');
const routerAbi = require('./JSON/pcs.json');
require("dotenv").config()

// ENV variables
const provider = process.env.PROVIDER;
const key = process.env.PRIVATE_KEY;

// SC variables
const token = "0x30B5E345C79255101B8af22a19805A6fb96DdEBb";

const wbnbAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const pcsFactory = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const pcsRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// ABI
// PancakeSwap Factory ABI - only for "getPair" function
const factoryAbi = ["function getPair(address tokenA, address tokenB) external view returns (address pair)"];
const abiPair = ["function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)", "function token0() external view returns (address)"];
const tokenAbi = ["function decimals() public view returns (uint8)", "function balanceOf(address account) public view returns (uint256)",
"function approve(address spender, uint256 amount) public returns (bool)"];
// Prices
let cexPrice = 0;
let pcsPrice = 0;
let finalPrice = 0;
let pairAddress = "";

// MAIN
const main = async () => {

try {

// Wallet connection
console.log("\n");
console.log("\x1b[33m%s\x1b[0m", "CONNECTING TO WALLET...");

const iProvider = new ethers.providers.JsonRpcProvider(provider);
const callerWallet = new ethers.Wallet(String(key), iProvider);

console.log("Connected!")
console.log("\n");

// DEX factory connection
console.log("\x1b[33m%s\x1b[0m", "CONNECTING TO SMART CONTRACTS...");

let factory = new ethers.Contract(pcsFactory, factoryAbi, callerWallet);
let router = new ethers.Contract(pcsRouter, routerAbi, callerWallet);
let tokenSc = new ethers.Contract(token, tokenAbi, callerWallet);
let tokenBusdSc = new ethers.Contract(wbnbAddress, tokenAbi, callerWallet);

console.log("Connected to PCS factory!");
console.log("\n");

const fetchPCSPrice = async () => {
    try {
        console.log("\x1b[33m%s\x1b[0m","Fetching pair address on PancakeSwap...");
    
        pairAddress = await factory.getPair(wbnbAddress, token);
        
        console.log("Pair Address: " + pairAddress);
        console.log("\n");
        
        console.log("\x1b[33m%s\x1b[0m","Connecting pair address on PancakeSwap...");
        
         // Connect to the smart contract
        const pairSc = new ethers.Contract(pairAddress, abiPair, iProvider);
        
        // Fetch the reserves of tokens
        console.log("\n");
        console.log("\x1b[33m%s\x1b[0m","Fetching reserves...");
        let [reserves0, reserves1, ] = await pairSc.getReserves();
        
        console.log("Reserve0: " + reserves0);
        console.log("Reserve1: " + reserves1);
        
        let token0 = await pairSc.token0();
        
        console.log("\n");
        console.log("\x1b[33m%s\x1b[0m","Fetching price...");

        // let decimals0 = await tokenSc.decimals();
        // let decimals1 = await tokenBusdSc.decimals();
        
        if(token0 == wbnbAddress) {
            // Reserve 0 / reserve 1
            pcsPrice = ethers.BigNumber.from(reserves0) / ethers.BigNumber.from(reserves1);
          } else {
            // Reserve 1 / reserve 0
              pcsPrice = ethers.BigNumber.from(reserves1) / ethers.BigNumber.from(reserves0);
          }
        
        console.log("PCS price: " + pcsPrice + " WBNB");

                // Fethc wBNB's price in USD, from CoinGeko
                let url = new URL(`https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`);
                let response = await fetch(url);
                let result = await response.json();
                let bnbPrice = result.market_data.current_price.usd;

        finalPrice = pcsPrice * bnbPrice;

        console.log("PCS price: " + finalPrice + " BUSD");

        comparePrices();
    } catch (error) {
        console.log("Error PCS price: " + error);
    }
}


const fetchKuCoinPrice = async () => {
    try {
        console.log("\x1b[33m%s\x1b[0m","Fetching token price on KuCoin... /n")
    
    //     let url = new URL(`https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0x30b5e345c79255101b8af22a19805a6fb96ddebb`);
    //     let response = await fetch(url);
    //     let result = await response.json();
    //     cexPrice = result.tickers[0].last;
    // //    cexPrice = parseFloat(0.003208148139378678); // Testing

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
          cexPrice = parseFloat(response.data.price);
        //   console.log(`The current price of REV3L-USDT is: ${cexPrice}`);
        });
      }).on("error", (err) => {
        console.log("Error: " + err.message);
      });
      
        
        console.log("Token price on KuCoin: "+ cexPrice);
        console.log("\n");

        
        fetchPCSPrice();
    } catch (error) {
        console.log("Error KuCoin Price: " + error);
    }  

}


const buyTokensWithBnb = async (amount) => {
        try {

        let _amount = ethers.utils.parseEther(String(amount));
        let _minOut = amount / finalPrice;

        await tokenBusdSc.approve(pcsRouter, _amount);

        const gasLimit = await router.estimateGas.swapTokensForExactTokens(
            String(Math.round(_minOut)), // Min out
            String(_amount), // Amount
            [wbnbAddress, token], // Path
            callerWallet.address, // Receiver
            Math.floor(Date.now() / 1000) + 60 * 20,
            {from: callerWallet.address});

            console.log("GAS: " + String(gasLimit));

        // let tx = await router.swapExactTokensForTokens(
        //     String(Math.round(_minOut)), // Min out
        //     String(_amount), // Amount
        //     [busd, token], // Path
        //     callerWallet.address, // Receiver
        //     Math.floor(Date.now() / 1000) + 60 * 20,
        //     {from: callerWallet.address, gasLimit: gasLimit.toString()});

        //     tx.wait();

            console.log("Bought with " + amount + " BUSD");
        } catch (error) {
            console.log("Failed to buy: " + error);
        } 
}


const sellTokensForBnb = async (amount) => {
        try {
        // How many tokens should be sold for "amount" of BUSD
        let _howManyTokens = ethers.BigNumber.from(Math.round(amount / finalPrice));
        let _amount = ethers.utils.parseEther(String(amount));

        await tokenSc.approve(pcsRouter, _amount);

        const gasLimit = await router.estimateGas.swapTokensForExactTokens(
            String(Math.round(_howManyTokens)), // Min out
            String(_amount), // Amount
            [token, wbnbAddress], // Path
            callerWallet.address, // Receiver
            (Math.floor(Date.now() / 1000) + 60 * 20), 
            {from: callerWallet.address});

            console.log("GAS: " + String(gasLimit));

        // let tx = await router.swapExactTokensForTokens(
        //     String(Math.round(_howManyTokens)), // Min out
        //     String(_amount), // Amount
        //     [token, busd], // Path
        //     callerWallet.address, // Receiver
        //     (Math.floor(Date.now() / 1000) + 60 * 20), 
        //     {from: callerWallet.address, gasLimit: gasLimit.toString()});

        //     tx.wait();

            console.log("Sold for " + amount + " BUSD");
        } catch (error) {
            console.log("Failed to sell: " + error);
        }
}


const buy = async () => {
        try {
            let dif = cexPrice - finalPrice;

            let x = dif * 100 / cexPrice;
            console.log("Dif: +" + parseFloat(x).toFixed(2) + "% bigger on DEX");

            if(x > 50) {console.log("\x1b[31m", "\n ERR! \n ")}
            else if(x<= 50 && x > 35) {
                console.log("\x1b[32m", "\n Buying with 750 BUSD! \n ");
                buyTokensWithBnb(750);
            }
            else if(x<= 35 && x > 20) {
                console.log("\x1b[32m", "\n Buying with 500 BUSD! \n ");
                buyTokensWithBnb(0.1);
            }
            else if(x<= 20 && x > 10) {
                console.log("\x1b[32m", "\n Buying with 250 BUSD! \n ");
                buyTokensWithBnb(250);
            }
            else if(x<= 10 && x > 5) {
                console.log("\x1b[32m", "\n Buying with 150 BUSD! \n ");
                buyTokensWithBnb(150);
            }
            else if(x<= 5 && x > 2.5) {
                console.log("\x1b[32m", "\n Buying with 50 BUSD! \n ");
                buyTokensWithBnb(50);
            }
            else if(x<= 2.5 && x > 1) {
                console.log("\x1b[32m", "\n Buying with 25 BUSD! \n ");
                buyTokensWithBnb(25);
            }
            else if(x<= 1) {console.log("\x1b[32m","\n Done! \n ")}
        } catch (error) {
            console.log("Err:" + error);
        }
}


const sell = async () => {
        try {
            let dif = finalPrice - cexPrice;

            let x = dif * 100 / finalPrice;
            console.log("Dif: -" + parseFloat(x).toFixed(2) + "% lower on DEX");

            if(x > 50) {console.log("\x1b[31m", "\n ERR! \n ")}
            else if(x<= 50 && x > 35) {
                console.log("\x1b[31m", "\n Sell for 750 BUSD! \n ");
                sellTokensForBnb(750);
            }
            else if(x<= 35 && x > 20) {
                console.log("\x1b[31m", "\n Sell for 500 BUSD! \n ");
                sellTokensForBnb(500);
            }
            else if(x<= 20 && x > 10) {
                console.log("\x1b[31m", "\n Sell for 250 BUSD! \n ");
                sellTokensForBnb(250);  
            }
            else if(x<= 10 && x > 5) {
                console.log("\x1b[31m", "\n Sell for 150 BUSD! \n ");
                sellTokensForBnb(150);       
            }
            else if(x<= 5 && x > 2.5) {
                console.log("\x1b[31m", "\n Sell for 50 BUSD! \n ");
                sellTokensForBnb(50);
            }
            else if(x<= 2.5 && x > 1) {
                console.log("\x1b[31m", "\n Sell for 25 BUSD! \n ");
                sellTokensForBnb(25);
            }
            else if(x<= 1) {console.log("\x1b[32m","\n Done! \n ")}
        } catch (error) {
            console.log("Err:" + error);
        }
}
    
    
const comparePrices = async () => {
    try {
        console.log("\n");
        console.log("\x1b[33m%s\x1b[0m","Comparing prices...");
        
        
        if(cexPrice > finalPrice) {
            console.log("Cex Price: " + "[" + cexPrice + "]" + "is bigger than Dex Price " + "[" + finalPrice + "]" )
            console.log("Buying on PCS...");
            console.log("\n");
            buy();
        } else if(cexPrice < finalPrice) {
            console.log("Cex Price: " + "[" + cexPrice + "]" + "is lower than Dex Price " + "[" + finalPrice + "]" )
            console.log("Selling on PCS...");
            console.log("\n");
            sell();        }
    } catch (error) {
        console.log("Error compare prices: " + error);
    }
}


setInterval(function(){ 
    fetchKuCoinPrice();  
}, 5000); 

} catch (error) {
    console.log("Error: " + error);
}
}

main()