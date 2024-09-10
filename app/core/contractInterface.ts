import { ethers } from "ethers";
import contracts from '../../constants/deploy-dev.json';
import ABIs from '../../constants/ABIs.json';

export default class contractInterface {
  int: any;
  ready: bool;
  commsRail: any;
  requestManager: any;
  bondContractsManager: any;
  bondRequestBank: any;
  bondBank: any;
  borrowerNFTManager: any;
  lenderNFTManager: any;
  borrower: any;
  lender: any;

  constructor(_int: any) {
    this.int = _int;
    this.ready = false;
  }

  async ensureSignerAvailable() {
    await this.int.ensureSignerAvailable(); 
  }


  async ensureLocalNodeNetwork() {
    await this.int.ensureLocalNodeNetwork();
  }

  async setup() {
    await this.int.ensureLocalNodeNetwork();

    try {
      await this.int.setup();

      this.commsRail = new ethers.Contract(contracts.address, ABIs.CommsRail, this.int.provider);

      const requestManagerAddress = await this.commsRail.requestManager();
      this.requestManager = new ethers.Contract(requestManagerAddress, ABIs.RequestManager, this.int.provider);
      const bondContractsManagerAddress = await this.commsRail.bondContractsManager();
      this.bondContractsManager = new ethers.Contract(bondContractsManagerAddress, ABIs.BondContractsManager, this.int.provider);
      const bondRequestBankAddress = await this.commsRail.bondRequestBank();
      this.bondRequestBank = new ethers.Contract(bondRequestBankAddress, ABIs.BondRequestBank, this.int.provider);
      const bondBankAddress = await this.commsRail.bondRequestBank();
      this.bondBank = new ethers.Contract(bondBankAddress, ABIs.BondBank, this.int.provider);

      let borrowerAddress = await this.commsRail.borrower();
      this.borrower = new ethers.Contract(borrowerAddress, ABIs.Borrower, this.int.provider);
      let lenderAddress = await this.commsRail.lender();
      this.lender = new ethers.Contract(lenderAddress, ABIs.Lender, this.int.provider);

      this.ready = true;
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
    try {
      return this.get2dArray(await this.requestManager.getBalances(this.int.signer.address));
    } catch (error) {
      if(this.ready) {
        throw error;
      }
    }
  }

  async postBondRequest(request) {
    let result;
    if(request[0] == '0x0000000000000000000000000000000000000001') {
      result = await this.requestManager.connect(this.int.signer).postBondRequest(...request, {value: request[1]});
    } else {
      const token = new ethers.Contract(request[0], ABIs.IERC20, this.int.provider);
      result = await(await token.connect(this.int.signer).approve(this.bondRequestBank.target, request[1])).wait();
      result = await(await this.commsRail.connect(this.int.signer).submitEntry(request[0], this.int.signer.address, this.requestManager.target, request[1])).wait();
      result = await this.requestManager.connect(this.int.signer).postBondRequest(...request);
    }
    return result;
  }

  async lendToBorrower(request, amountRequired) {
    let result;
    if(request[1] == '0x0000000000000000000000000000000000000001') {
      result = await(await this.bondContractsManager.connect(this.int.signer).lendToBorrower(request, {value: amountRequired})).wait();
    } else {
      const token = new ethers.Contract(request[3], ABIs.IERC20, this.int.provider);
      result = await(await token.connect(this.int.signer).approve(this.bondRequestBank.target, amountRequired)).wait();
      result = await(await this.commsRail.connect(this.int.signer).submitEntry(request[3], this.int.signer.address, this.bondContractsManager.target, amountRequired)).wait();
      result = await this.bondContractsManager.connect(this.int.signer).lendToBorrower(request);
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
    res.push(Array.from(await this.bondContractsManager.connect(this.int.signer).getBorrowersIds()));
    res.push(Array.from(await this.bondContractsManager.connect(this.int.signer).getLendersIds()));

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
    await(await this.requestManager.connect(this.int.signer).cancelBondRequest(request)).wait();
  }

  async lenderWithdraw(bondId) {
    await(await this.lender.connect(this.int.signer).withdraw(bondId)).wait();
  }

  async borrowerDeposit(bond, amount) {
    let res;

    if(bond[7] == '0x0000000000000000000000000000000000000001') {
      res = await(await this.borrower.connect(this.int.signer).deposit(bond[0], amount, {value: amount})).wait();
    } else {
      console.log(bond);
      const token = new ethers.Contract(bond[7], ABIs.IERC20, this.int.provider);
      res = await(await token.connect(this.int.signer).approve(this.bondBank.target, amount)).wait();
      res = await(await this.borrower.connect(this.int.signer).deposit(bond[0], amount)).wait();
    }

    return res;
  }

  async borrowerWithdraw(bond, amount) {
    let res;

    console.log(amount);

    if(bond[7] == '0x0000000000000000000000000000000000000001') {
      res = await(await this.borrower.connect(this.int.signer).withdraw(bond[0], amount)).wait(); 
    } else {
      res = await(await this.borrower.connect(this.int.signer).withdraw(bond[0], amount)).wait();
    }
  }
}
