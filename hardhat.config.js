import "@nomicfoundation/hardhat-ethers";

export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./contracts/test",
    cache: "./contracts/cache",
    artifacts: "./web/src/contracts/artifacts"
  },
  typechain: {
    outDir: 'web/src/contracts/types',
    target: 'ethers-v6',
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
