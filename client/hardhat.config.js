require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat/config");

const path = require('path');

module.exports = {
  solidity: "0.8.18",
  paths: {
    sources: "./contracts",  // Contract source directory
    tests: "./test",         // Test files directory
    cache: "./cache",        // Cache directory
    artifacts: "./artifacts" // Compiled artifacts directory
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    },
  }
};
