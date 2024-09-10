'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import Button from '@mui/material/Button';

import toDecimalsMapping from '../../../constants/toDecimalsMapping.json';
import toImageMapping from '../../../constants/toImageMapping.json';
import { image } from 'token-icons';

import Status from '../../components/status';
import NavBar from '../../components/navbar';

import browserWalletInterface from '../../core/browserWalletInterface';
import testWalletnterface from '../../core/testWalletInterface';
import contractInterface from '../../core/contractInterface';

function formatTokenAmount(amount, decimals) {
  if(amount == 0) return 0; 
  let tokenAmount = (amount / Math.pow(10, decimals));
  let maxDecimals = 8 - Math.floor(Math.log10(tokenAmount));
  maxDecimals = Math.max(0, maxDecimals);
  let formattedAmount = tokenAmount.toFixed(maxDecimals);
  formattedAmount = formattedAmount.replace(/\.?0+$/, '');
  if (formattedAmount.length > 10) {
    formattedAmount = tokenAmount.toExponential(3).replace(/\.?0+e/, 'e');
  }

  return formattedAmount;
}

function convertHours(hours) {
  const units = [
    { label: 'year', hours: 24 * 365 },
    { label: 'month', hours: 24 * 30 },
    { label: 'week', hours: 24 * 7 },
    { label: 'day', hours: 24 }
  ];

  let result = [];

  for (let { label, hours: unitHours } of units) {
    if (hours >= unitHours) {
      let value = Math.floor(hours / unitHours);
      hours %= unitHours;
      result.push(`${value} ${label}${value > 1 ? 's' : ''}`);
    }
  }

  if (hours > 0) {
    result.push(`${Math.floor(hours)} hour${hours > 1 ? 's' : ''}`);
  }

  return result.join(', ');
}

export default function NewBond() {
  //let contract = new contractInterface(new browserWalletInterface());
  let contract = new contractInterface(new testWalletnterface());

  const searchParams = useSearchParams();
  const bondRequest = atob(searchParams.get('bondRequest')).split(",");
  const [borrowingAmount, setBorrowingAmount] = useState(0);
  const [status, setStatus] = useState({code: 'loading', data: ''});

  bondRequest[2] = BigInt(bondRequest[2]);
  bondRequest[4] = BigInt(bondRequest[4]);
  bondRequest[5] = BigInt(bondRequest[5]);
  bondRequest[6] = BigInt(bondRequest[6]);

  useEffect(() => {
    const getData = async () => {
      try {
        await contract.setup();
        await contract.ensureLocalNodeNetwork();
        await contract.ensureSignerAvailable();
        setBorrowingAmount(await contract.getRequiredAmountForRequest(bondRequest));
        setStatus({code: 'ok', data: ''});
      } catch (error) {
        let processedError = error.toString().split('(')[0].split('Error: ')[1];
        setStatus({code: 'error', data: processedError});
      }
    };
    getData();
  }, []);

  const onClick = async() => {
    setStatus({code: 'loading', data:''});
    await contract.setup();
    await contract.ensureLocalNodeNetwork();
    await contract.ensureSignerAvailable();

    try {
      console.log(bondRequest, borrowingAmount);
      await contract.lendToBorrower(bondRequest, borrowingAmount);
      setStatus({code: 'success', data:'transaction completed'});
      window.location.replace('/lend');
    } catch (error) {
      if(error.toString().split('Error: execution reverted (no data present; likely require(false) occurred').length > 1) {
        setStatus({code: 'error', data: 'unrecoverable error, please reset the test enviorment'});
      } else {
        let processedError = error.toString().split('(')[0].split('Error: ')[1];
        setStatus({code: 'error', data: processedError});
      }
    }
  }

  return (
    <div className="flex flex-col w-full h-screen">
      <NavBar />
        <div className="flex flex-col flex-grow bg-slate-100 dark:bg-slate-900 text-white">
          <div className="flex flex-col flex-grow items-center justify-center min-h-max">
            <div className="min-w-max px-5 pb-4 border-transparent rounded-md bg-white dark:bg-gray-700 shadow-xl">
              <h1 className="text-2xl dark:text-white my-2">lend</h1>
              <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
              <h1 className="text-md dark:text-white mb-2">borrower</h1>
              <a className="text-sm mb-2">{bondRequest[0]}</a>
              <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
              <h1 className="text-md dark:text-white mb-2">collatral</h1> 
              <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[bondRequest[1]])} />
                <a className="text-xl">{formatTokenAmount(parseInt(bondRequest[2]), toDecimalsMapping[bondRequest[1]])}</a>
              </div>
              <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
              <h1 className="text-md dark:text-white mb-2">borrowing</h1> 
              <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[bondRequest[3]])} />
                <a className="text-xl">{formatTokenAmount(parseInt(borrowingAmount), toDecimalsMapping[bondRequest[3]])}</a>
              </div>
              <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
              <h1 className="text-md dark:text-white mb-2">duration</h1> 
              <div className="flex items-center mb-2">
                <a className="text-xl">{convertHours(parseInt(bondRequest[5]))}</a>
              </div>
              <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
              <h1 className="text-md dark:text-white mb-2">intrest</h1> 
              <div className="flex items-center mb-2">
                <a className="text-xl">{`${bondRequest[6]}%`}</a>
              </div>
              <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
              {(status.code !== 'ok') && <Status status={status} />}
              <Button variant="contained" onClick={onClick} className="w-full bg-sky-500 hover:bg-sky-400 rounded-md text-white">lend</Button>
            </div>
          </div>
        </div>
      </div>
  );
}
