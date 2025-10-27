export default {
  solidity: "0.8.20",
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
