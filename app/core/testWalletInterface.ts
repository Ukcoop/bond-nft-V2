import { ethers } from "ethers";

export default class testWalletInterface {
  signer: any;
  provider: any;

  async setup() {
    this.provider = new ethers.JsonRpcProvider(window.location.protocol + "//" + window.location.host + '/api/proxy');
  }

  async ensureSignerAvailable() {
    this.signer = await this.provider.getSigner();
  }

  async ensureLocalNodeNetwork() {
    return;
  }
}
