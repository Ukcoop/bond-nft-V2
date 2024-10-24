'use client';

import { useEffect, useState } from 'react';

import toDecimalsMapping from '../../../constants/toDecimalsMapping.json';
import toImageMapping from '../../../constants/toImageMapping.json';
import { image } from 'token-icons';

import Status from '../../components/status';
import Button from '../../components/button';

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

export default function InitBond({ contract, reset, request }) {
  const [borrowingAmount, setBorrowingAmount] = useState(0);
  const [status, setStatus] = useState({code: 'loading', data: ''});
 
  useEffect(() => {
    const getData = async () => {
      try {
        await contract.setup();
        await contract.ensureLocalNodeNetwork();
        await contract.ensureSignerAvailable();
        setBorrowingAmount(await contract.getRequiredAmountForRequest(request));
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
      await contract.lendToBorrower(request, borrowingAmount);
      setStatus({code: 'success', data:'transaction completed'});
      reset();
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
    <div className="flex flex-col flex-grow h-screen p-5 bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div className="flex justify-between pb-2 min-h-10">
        <h1 className="text-3xl dark:text-white">New Bond</h1>
        <div className="w-min"><Button text="Return" style="secondary" onClick={() => {reset()}}/></div>
      </div>
        <div className="h-0 border border-sky-500"></div>
      <div className="w-max pt-2">
        <h1 className="text-md dark:text-white mb-2">borrower</h1>
        <a className="text-sm dark:text-white mb-2">{request[0]}</a>
        <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
        <h1 className="text-md dark:text-white mb-2">collatral</h1> 
        <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[request[1]])} />
          <a className="text-xl dark:text-white">{formatTokenAmount(parseInt(request[2]), toDecimalsMapping[request[1]])}</a>
        </div>
        <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
        <h1 className="text-md dark:text-white mb-2">borrowing</h1> 
        <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[request[3]])} />
          <a className="text-xl dark:text-white">{formatTokenAmount(parseInt(borrowingAmount), toDecimalsMapping[request[3]])}</a>
        </div>
        <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
        <h1 className="text-md dark:text-white mb-2">duration</h1> 
        <div className="flex items-center mb-2">
          <a className="text-xl dark:text-white">{convertHours(parseInt(request[5]))}</a>
        </div>
        <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
        <h1 className="text-md dark:text-white mb-2">intrest</h1> 
        <div className="flex items-center mb-2">
          <a className="text-xl dark:text-white">{`${request[6]}%`}</a>
        </div>
        <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
        {(status.code !== 'ok') && <Status status={status} />}
        <Button text="Lend" style="primary" onClick={onClick}/>
      </div>
    </div>
  );
}
