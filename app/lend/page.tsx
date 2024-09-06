'use client';

import { useEffect, useState } from 'react';

import NavBar from '../components/navbar';
import BondRequest from '../components/bondRequest';
import Status from '../components/status';
import contractInterface from '../core/contractInterface';

export default function Lend() {
  let contract = new contractInterface();

  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState({code: 'loading', data: ''});
  const [borrowingTokenAmounts, setBorrowingTokenAmounts] = useState([]);

  useEffect(() => {
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

    getData();
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <NavBar />
        <main className="flex flex-col w-screen flex-grow p-5 bg-slate-100 dark:bg-slate-900">
          <h1 className="text-3xl dark:text-white mb-2">lend</h1>
          <div className="h-0 border border-sky-500"></div>
          <div className="flex-grow w-full overflow-auto min-h-max pt-2">
            {(requests.length !== 0) ? requests.map((request, index) => (
              <BondRequest key={index} request={request} borrowingAmount={borrowingTokenAmounts[index]} />
            )) : (
                (status.code !== 'ok') ? (<Status status={status} />) : (
                  <div className="flex justify-center items-center h-20 w-full dark:text-white text-lg">
                    there are no requests available
                  </div>
                )
              )}
          </div>
        </main>
      </div>
  );
}
