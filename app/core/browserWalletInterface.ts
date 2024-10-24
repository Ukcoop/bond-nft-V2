import { ethers } from "ethers";

export default class metamaskInterface {
  signer: any;
  provider: any;

  async setup() {
    if (window.ethereum == null) {
      this.provider = ethers.getDefaultProvider();
    } else {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  async ensureSignerAvailable() {
    if (this.signer !== undefined) return;

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.signer = await this.provider.getSigner();
    } catch (error) {
      console.error("User denied account access or error occurred: ", error);
    }
  }

  async ensureLocalNodeNetwork() {
    const localNodeUrl = window.location.protocol + "//" + window.location.host + '/api/proxy';
    const localNodeChainId = '0x7A69'; // 31137 in hexadecimal
    
    const localNodeParams = {
      chainId: localNodeChainId,
      chainName: 'Hardhat local node',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: [localNodeUrl],
      blockExplorerUrls: null,
    };

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: localNodeChainId }],
      });
      console.log("Switched to the local node network");
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [localNodeParams],
          });
          console.log('Local node network added. Switching now...');
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: localNodeChainId }],
          });
          console.log('Switched to the local node network');
        } catch (addError) {
          console.error('Failed to add local node network: ', addError);
        }
      } else {
        console.error('Failed to switch to the local node network: ', switchError);
      }
    }
  }
}
