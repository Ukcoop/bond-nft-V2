'use client';

import { useEffect, useState } from 'react';

import toDecimalsMapping from '../../../constants/toDecimalsMapping.json';
import toImageMapping from '../../../constants/toImageMapping.json';
import { image } from 'token-icons';

import { formatTokenAmount, parseDays } from '../../core/shared.ts';

import Status from '../../components/status';
import Button from '../../components/button';

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
          <a className="text-xl dark:text-white">{parseDays(parseInt(request[5]))}</a>
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
