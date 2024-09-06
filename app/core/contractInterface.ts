import { ethers } from "ethers";
import contracts from '../../constants/deploy-dev.json';
import ABIs from '../../constants/ABIs.json';

export default class contractInterface {
  signer: any;
  provider: any;
  commsRail: any;
  requestManager: any;
  bondContractsManager: any;
  bondRequestBank: any;
  bondBank: any;
  borrowerNFTManager: any;
  lenderNFTManager: any;
  borrower: any;
  lender: any;

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
    const localNodeUrl = 'http://127.0.0.1:8545';
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

  async setup() {
    await this.ensureLocalNodeNetwork();

    try {
      if (window.ethereum == null) {
        this.provider = ethers.getDefaultProvider();
      } else {
        this.provider = new ethers.BrowserProvider(window.ethereum);
      }

      this.commsRail = new ethers.Contract(contracts.address, ABIs.CommsRail, this.provider);

      const requestManagerAddress = await this.commsRail.requestManager();
      this.requestManager = new ethers.Contract(requestManagerAddress, ABIs.RequestManager, this.provider);
      const bondContractsManagerAddress = await this.commsRail.bondContractsManager();
      this.bondContractsManager = new ethers.Contract(bondContractsManagerAddress, ABIs.BondContractsManager, this.provider);
      const bondRequestBankAddress = await this.commsRail.bondRequestBank();
      this.bondRequestBank = new ethers.Contract(bondRequestBankAddress, ABIs.BondRequestBank, this.provider);
      const bondBankAddress = await this.commsRail.bondRequestBank();
      this.bondBank = new ethers.Contract(bondBankAddress, ABIs.BondBank, this.provider);

      let borrowerAddress = await this.commsRail.borrower();
      this.borrower = new ethers.Contract(borrowerAddress, ABIs.Borrower, this.provider);
      let lenderAddress = await this.commsRail.lender();
      this.lender = new ethers.Contract(lenderAddress, ABIs.Lender, this.provider);

    } catch {}
  }

  async getBondRequests() {
    return Array.from(await this.requestManager.getBondRequests());
  }

  async getRequiredAmountForRequest(request) {
    return await this.requestManager.getRequiredAmountForRequest(request);
  }

  get2dArray(array) {
    let res = Array.from(array);

    for (let i = 0; i < res.length; i++) {
      res[i] = Array.from(res[i]);
    }

    return res;
  }

  async getBalances() {
    return this.get2dArray(await this.requestManager.getBalances(this.signer.address));
  }

  async postBondRequest(request) {
    let result;
    if(request[0] == '0x0000000000000000000000000000000000000001') {
      result = await this.requestManager.connect(this.signer).postBondRequest(...request, {value: request[1]});
    } else {
      const token = new ethers.Contract(request[0], ABIs.IERC20, this.provider);
      result = await(await token.connect(this.signer).approve(this.bondRequestBank.target, request[1])).wait();
      result = await(await this.commsRail.connect(this.signer).submitEntry(request[0], this.signer.address, this.requestManager.target, request[1])).wait();
      result = await this.requestManager.connect(this.signer).postBondRequest(...request);
    }
    return result;
  }

  async lendToBorrower(request, amountRequired) {
    let result;
    if(request[1] == '0x0000000000000000000000000000000000000001') {
      result = await(await this.bondContractsManager.connect(this.signer).lendToBorrower(request, {value: amountRequired})).wait();
    } else {
      const token = new ethers.Contract(request[3], ABIs.IERC20, this.provider);
      result = await(await token.connect(this.signer).approve(this.bondRequestBank.target, amountRequired)).wait();
      result = await(await this.commsRail.connect(this.signer).submitEntry(request[3], this.signer.address, this.bondContractsManager.target, amountRequired)).wait();
      result = await this.bondContractsManager.connect(this.signer).lendToBorrower(request);
    }
    return result;
  }

  async getDataForNFT(id, type) {
    let res;
    if(type == 'borrower') {
      res = Array.from(await this.borrower.getData(id));
      res.push(await this.lender.getCollatralizationPercentage(id));
    } else {
      res = Array.from(await this.lender.getData(id));
      res.push(await this.lender.getCollatralizationPercentage(id));
    }

    return res;
  }

  async getNFTData() {
    let res = [];
    res.push(Array.from(await this.bondContractsManager.connect(this.signer).getBorrowersIds()));
    res.push(Array.from(await this.bondContractsManager.connect(this.signer).getLendersIds()));

    if(res[0].length == 0 && res[1].length == 0) return [[], []];

    for(let i = 0; i < res[0].length; i++) {
      res[0][i] = await this.getDataForNFT(res[0][i], 'borrower');
    }

    for(let i = 0; i < res[1].length; i++) {
      res[1][i] = await this.getDataForNFT(res[1][i], 'lender');
    }

    return res;
  }

  async cancelBondRequest(request) {
    await(await this.requestManager.connect(this.signer).cancelBondRequest(request)).wait();
  }

  async lenderWithdraw(bondId) {
    await(await this.lender.connect(this.signer).withdraw(bondId)).wait();
  }

  async borrowerDeposit(bond, amount) {
    let res;

    if(bond[7] == '0x0000000000000000000000000000000000000001') {
      res = await(await this.borrower.connect(this.signer).deposit(bond[0], amount, {value: amount})).wait();
    } else {
      console.log(bond);
      const token = new ethers.Contract(bond[7], ABIs.IERC20, this.provider);
      res = await(await token.connect(this.signer).approve(this.bondBank.target, amount)).wait();
      res = await(await this.borrower.connect(this.signer).deposit(bond[0], amount)).wait();
    }

    return res;
  }

  async borrowerWithdraw(bond, amount) {
    let res;

    console.log(amount);

    if(bond[7] == '0x0000000000000000000000000000000000000001') {
      res = await(await this.borrower.connect(this.signer).withdraw(bond[0], amount)).wait(); 
    } else {
      res = await(await this.borrower.connect(this.signer).withdraw(bond[0], amount)).wait();
    }
  }
}
