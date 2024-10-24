'use client';

import { useEffect, useState } from 'react';

import BondRequest from '../components/bondRequest';
import Status from '../components/status';
import InitBond from './subPages/initBond';

export default function Lend({ contract }) {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState({code: 'loading', data: ''});
  const [borrowingTokenAmounts, setBorrowingTokenAmounts] = useState([]);
  const [selectedRequest, selectRequest] = useState([]);

  const getData = async () => {
    try {
      await contract.setup();
      await contract.ensureLocalNodeNetwork();

      const newRequests = contract.get2dArray(await contract.getBondRequests());
      const newBorrowingTokenAmounts = [];

      for (let i = 0; i < newRequests.length; i++) {
        newBorrowingTokenAmounts[i] = parseInt(await contract.getRequiredAmountForRequest(newRequests[i]));
      }

      setRequests(newRequests);
      setBorrowingTokenAmounts(newBorrowingTokenAmounts);
      setStatus({code: 'ok', data: ''});
    } catch (error) {
      let processedError = error.toString().split('(')[0].split('Error: ')[1];
      setStatus({code: 'error', data: processedError});
    }
  };

  const reset = async() => {
    await setRequests([]);
    await setStatus({code: 'loading', data: ''});
    await selectRequest([]);
    getData();
  }

  useEffect(() => {
    getData();
  }, []);



  return (
    <>
    {(selectedRequest.length !== 0) ? (<InitBond contract={contract} reset={reset} request={selectedRequest}/>) : ( 
    <div className="flex flex-col flex-grow h-screen p-5 bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <h1 className="text-3xl dark:text-white pb-2 min-h-10">Lend</h1>
        <div className="h-0 border border-sky-500"></div>
        <div className="flex-grow w-full overflow-auto min-h-max pt-2">
          {(requests.length !== 0) ? requests.map((request, index) => (
            <BondRequest key={index} request={request} borrowingAmount={borrowingTokenAmounts[index]} action={selectRequest}/>
          )) : (
            (status.code !== 'ok') ? (<Status status={status} />) : (
              <div className="flex justify-center items-center h-20 w-full dark:text-white text-lg">
                there are no requests available
              </div>
            )
          )}
      </div>
    </div>)
    }
    </>
  );
}
