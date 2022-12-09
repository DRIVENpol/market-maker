const ethers = require('ethers');
require("dotenv").config()

// ENV variables
const provider = process.env.PROVIDER;
const key = process.env.PRIVATE_KEY;

// SC variables
const token = "0x30B5E345C79255101B8af22a19805A6fb96DdEBb";
// const token = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"; // cake

const busd = "0xe9e7cea3dedca5984780bafc599bd69add087d56";
const pcsFactory = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const pcsRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// ABI
// PancakeSwap Factory ABI - only for "getPair" function
const factoryAbi = ["function getPair(address tokenA, address tokenB) external view returns (address pair)"];
const abiPair = ["function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)", "function token0() external view returns (address)"];
const tokenAbi = ["event Transfer(address indexed from, address indexed to, uint256 value)"];

// Prices
let dexPrice = 0;
let pcsPrice = 0;
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
console.log("\x1b[33m%s\x1b[0m", "CONNECTING TO PCS FACTORY...");

let factory = new ethers.Contract(pcsFactory, factoryAbi, callerWallet);

console.log("Connected to PCS factory!");
console.log("\n");

const fetchKuCoinPrice = async () => {
    try {
        console.log("\x1b[33m%s\x1b[0m","Fetching REV3L's price on KuCoin... /n")
    
        let url = new URL(`https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0x30b5e345c79255101b8af22a19805a6fb96ddebb`);
        let response = await fetch(url);
        let result = await response.json();
        // dexPrice = result.tickers[0].last;
        dexPrice = parseFloat(0.006408148139378678); // Testing
        
        console.log("REV3L's price on KuCoin: "+ result.tickers[0].last);
        console.log("\n");   
    } catch (error) {
        console.log("Error KuCoin Price: " + error);
    }  

    }
    
    const fetchPCSPrice = async () => {
    try {
        console.log("\x1b[33m%s\x1b[0m","Fetching pair address on PancakeSwap...");
    
        pairAddress = await factory.getPair(busd, token);
        
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
        
        if(token0 == busd) {
            pcsPrice = ethers.BigNumber.from(reserves0) / ethers.BigNumber.from(reserves1);
          } else {
              pcsPrice = ethers.BigNumber.from(reserves1) / ethers.BigNumber.from(reserves0);
          }
        
        console.log("PCS price: " + pcsPrice + " BUSD");

        comparePrices();
    } catch (error) {
        console.log("Error PCS price: " + error);
    }
    }

    const buy = async () => {
        try {
            let dif = dexPrice - pcsPrice;

            let x = dif * 100 / dexPrice;
            console.log("Dif: +" + parseFloat(x).toFixed(2) + "% bigger on DEX");

            if(x > 50) {console.log("\n Buy with 1,000 BUSD! \n ")}
            else if(x<= 50 && x > 35) {console.log("\n Buy with 750 BUSD! \n ")}
            else if(x<= 35 && x > 20) {console.log("\n Buy with 500 BUSD! \n ")}
            else if(x<= 20 && x > 10) {console.log("\n Buy with 250 BUSD! \n ")}
            else if(x<= 10 && x > 5) {console.log("\n Buy with 150 BUSD! \n ")}
            else if(x<= 5 && x > 2.5) {console.log("\n Buy with 50 BUSD! \n ")}
            else if(x<= 2.5 && x > 1) {console.log("\n Buy with 25 BUSD! \n ")}
            else if(x<= 1) {console.log("\n Done! \n ")}
        } catch (error) {
            console.log("Err:" + error);
        }
    }

    const sell = async () => {
        try {
            let dif = pcsPrice - dexPrice;

            let x = dif * 100 / pcsPrice;
            console.log("Dif: -" + parseFloat(x).toFixed(2) + "% lower on DEX");

            if(x > 50) {console.log("\n Sell for 1,000 BUSD! \n ")}
            else if(x<= 50 && x > 35) {console.log("\n Sell for 750 BUSD! \n ")}
            else if(x<= 35 && x > 20) {console.log("\n Sell for 500 BUSD! \n ")}
            else if(x<= 20 && x > 10) {console.log("\n Sell for 250 BUSD! \n ")}
            else if(x<= 10 && x > 5) {console.log("\n Sell for 150 BUSD! \n ")}
            else if(x<= 5 && x > 2.5) {console.log("\n Sell for 50 BUSD! \n ")}
            else if(x<= 2.5 && x > 1) {console.log("\n Sell for 25 BUSD! \n ")}
            else if(x<= 1) {console.log("Done!")}
        } catch (error) {
            console.log("Err:" + error);
        }
    }
    
    
    const comparePrices = async () => {
    try {
        console.log("\n");
        console.log("\x1b[33m%s\x1b[0m","Comparing prices...");
        
        
        if(dexPrice > pcsPrice) {
            console.log("Cex Price: " + "[" + pcsPrice + "]" + "is lower than Dex Price " + "[" + dexPrice + "]" )
            console.log("Buying on PCS...");
            console.log("\n");
            buy();
        } else if(dexPrice < pcsPrice) {
            console.log("Cex Price: " + "[" + pcsPrice + "]" + "is bigger than Dex Price " + "[" + dexPrice + "]" )
            console.log("Selling on PCS...");
            console.log("\n");
            sell();        }
    } catch (error) {
        console.log("Error compare prices: " + error);
    }

}

// // Token SC connection
// console.log("\x1b[33m%s\x1b[0m", "CONNECTING TO TOKEN SC...");

//  // Connect to the smart contract
//  const pairSc2 = new ethers.Contract(pairAddress, tokenAbi, iProvider);

// console.log("Connected!")
// console.log("\n");

// console.log("\x1b[33m%s\x1b[0m", "LISTENING ON TOKEN EVENTS...");

// pairSc2.on("Transfer", (from, to, value) => {
//     let info = {
//       from: from,
//       to: to,
//       value: value,
//     };


//     if(info.from.toString() === pcsRouter) {
//         console.log("\x1b[32m", "BUY DETECTED!");
//         console.log("\x1b[32m","FROM: " + info.to.toString());
//         console.log("\x1b[32m","AMOUNT: " + info.value.toString())
//         console.log("\n");
        
//     } else if (info.to.toString() === pcsRouter) {
//         console.log("\x1b[31m", "SELL DETECTED!");
//         console.log("\x1b[31m","FROM: " + info.from.toString());
//         console.log("\x1b[31m","AMOUNT: " + info.value.toString())
//         console.log("\n");

//     }

//   });

setInterval(function(){ 
    fetchKuCoinPrice();
    fetchPCSPrice();  
}, 10000);


       
} catch (error) {
    console.log("Error: " + error);
}


}

main()