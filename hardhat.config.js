require("@nomicfoundation/hardhat-toolbox");
require("dotenv-extended").load();

if (!process.env.MAINNET_PRIVKEY) throw new Error("MAINNET_PRIVKEY missing from .env file");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      chainId: 1337,
      // forking: {
      //   enabled: true,
      //   url: `https://mainnet.infura.io/v3/${process.env.INFURA_MAINNET_KEY}`,
      //   // blockNumber: 19717000,
      // }
    },
    mainnet: {
      chainId: 1,
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_MAINNET_KEY}`,
      accounts: [process.env.MAINNET_PRIVKEY],
    },
    rinkeby: {
      chainId: 3,
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_TESTNET_KEY}`,
      gasPrice: 200000000000,
      accounts: [process.env.TESTNET_PRIVKEY],
    },
  },
  etherscan: {
    // ETH mainnet
    apiKey: process.env.ETHERSCAN_API_KEY,
  }
};
