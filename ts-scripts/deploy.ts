import { ethers } from 'ethers';
import * as fs from 'fs';

let ABIs = {};

async function addAbi(file: string, contract: string) {
  const contractJson = JSON.parse(fs.readFileSync(`./out/${file}/${contract}.json`, 'utf-8'));
  const abi = contractJson.abi;
  ABIs[contract] = contractJson.abi;  
}

async function deployContract(file: string, contract: string, args: Array<any>, signer: any) {
  const contractJson = JSON.parse(fs.readFileSync(`./out/${file}/${contract}.json`, 'utf-8'));
  const abi = contractJson.abi;
  const bytecode = contractJson.bytecode;

  ABIs[contract] = contractJson.abi;
  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  return  factory.deploy(...args);
}

async function deploy() {
  const provider = new ethers.JsonRpcProvider();
  const signer = await provider.getSigner();

  console.log('Deploying project...');
  const commsRail: any = await deployContract('commsRail.sol', 'CommsRail', [], signer);
  const unifiedBondBank = await deployContract('bank.sol', 'UnifiedBondBank', [commsRail.target], signer);
  const requestManager = await deployContract('requestManager.sol', 'RequestManager', [commsRail.target], signer);
  const bondContractsManager: any = await deployContract('bondContractsManager.sol', 'BondContractsManager', [commsRail.target], signer);
  const automationManager = await deployContract('automationManager.sol', 'AutomationManager', [commsRail.target, false], signer);

  const nftAddresses = await bondContractsManager.getNFTAddresses();
  const bondAddresses = await bondContractsManager.getBondAddresses();

  await commsRail.addAddress((unifiedBondBank.target), 'UnifiedBondBank');
  await commsRail.addAddress((requestManager.target), 'RequestManager');
  await commsRail.addAddress((bondContractsManager.target), 'BondContractsManager');
  await commsRail.addAddress(nftAddresses[0], 'BorrowerNFTManager');
  await commsRail.addAddress(nftAddresses[1], 'LenderNFTManager');
  await commsRail.addAddress(bondAddresses[0], 'Borrower');
  await addAbi('borrowerNFT.sol', 'Borrower');
  await commsRail.addAddress(bondAddresses[1], 'Lender');
  await addAbi('lenderNFT.sol', 'Lender');
  await commsRail.addAddress((automationManager.target), 'AutomationManager');

  await addAbi('IERC20.sol', 'IERC20');

  const tokens = await commsRail.getWhitelistedTokens();
  for(let i = 1; i < tokens.length - 1; i++) {
    await commsRail.swapETHforToken(tokens[i], 0, {value: BigInt(10 ** 18)});
  }

  console.log(`Contract deployed to address: ${commsRail.target}`);
  fs.writeFileSync('constants/deploy-dev.json', JSON.stringify({ address: commsRail.target }), 'utf-8');
  fs.writeFileSync('constants/ABIs.json', JSON.stringify(ABIs), 'utf-8');
}

deploy().catch(console.error);

