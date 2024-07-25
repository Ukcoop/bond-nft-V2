import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

const contractJson = JSON.parse(fs.readFileSync('./out/Counter.sol/Counter.json', 'utf-8'));

async function deploy() {
  const provider = new ethers.JsonRpcProvider();
  const signer = await provider.getSigner();

  const abi = contractJson.abi;
  const bytecode = contractJson.bytecode;

  const factory = new ethers.ContractFactory(abi, bytecode, signer);

  console.log('Deploying contract...');
  const contract = await factory.deploy();

  console.log(`Contract deployed to address: ${contract.target}`);
  fs.writeFileSync('constants/deploy-dev.json', JSON.stringify({ address: contract.target }), 'utf-8');
}

deploy().catch(console.error);

