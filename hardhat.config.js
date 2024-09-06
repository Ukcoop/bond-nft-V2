/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: "https://arb1.arbitrum.io/rpc",
      }
    },
  },
};
