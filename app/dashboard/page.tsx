'use client';

import { useEffect, useState } from 'react';

import NavBar from '../components/navbar';
import Bond from '../components/bond.tsx';
import Status from '../components/status';
import BondRequest from '../components/bondRequest';

import contractInterface from '../core/contractInterface';

export default function Dashboard() {
  let contract = new contractInterface();
  const [ids, setIds] = useState([[],[]]);
  const [requests, setRequests] = useState([]);
  const [borrowingTokenAmounts, setBorrowingTokenAmounts] = useState([]);
  const [status, setStatus] = useState({code: 'loading', data: ''});

  useEffect(() => {
    const getData = async () => {
      try {
        await contract.setup();
        await contract.ensureLocalNodeNetwork();
        await contract.ensureSignerAvailable();
        await setIds(await contract.getNFTData());

        const newBorrowingTokenAmounts = [];
        let newRequests = contract.get2dArray(await contract.getBondRequests());
        newRequests = newRequests.filter((request) => request[0] == contract.signer.address);

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

  const cancelFunction = async(request) => {
    setStatus({code: 'loading', data: ''});

    await contract.setup();
    await contract.ensureLocalNodeNetwork();
    await contract.ensureSignerAvailable();

    await contract.cancelBondRequest(request);

    window.location.replace('/dashboard');
  }

  return (
    <div className="flex flex-col w-full h-screen">
      <NavBar />
        <div className="flex flex-col flex-grow w-screen flex-grow p-5 bg-slate-100 dark:bg-slate-900">
          {(status.code == 'ok') ? (<div>
            <h1 className="text-3xl dark:text-white mb-2">borrower NFTs</h1>
              <div className="h-0 border border-sky-500"></div>
              {(ids[0].length == 0) ? <div className="flex justify-center items-center h-20 w-full dark:text-white text-lg">
                there are no borrower NFTs
              </div> : (
                  ids[0].map((id, index) => {
                    return <Bond data={id} type="borrower" key={index} />
                  })
                )}
              <h1 className="text-3xl dark:text-white mb-2">lender NFTs</h1>
              <div className="h-0 border border-sky-500"></div>
              {(ids[0].length == 0) ? <div className="flex justify-center items-center h-20 w-full dark:text-white text-lg">
                there are no lender NFTs
              </div> : (
                  ids[1].map((id, index) => {
                    return <Bond data={id} type="lender" key={index} />
                  })
                )}
              <h1 className="text-3xl dark:text-white mb-2">bond requests</h1>
              <div className="h-0 border border-sky-500"></div>
              <div className="flex justify-center items-center h-20 w-full dark:text-white text-lg">
                {(requests.length == 0) ? <div className="flex justify-center items-center h-20 w-full dark:text-white text-lg">
                  you do not have any open bond requests
                </div> : (
                    requests.map((request, index) => (
                      <BondRequest key={index} request={request} borrowingAmount={borrowingTokenAmounts[index]} cancel={true} cancelFunction={cancelFunction}/>
                    ))
                  )}
              </div> 
            </div>) : (<Status status={status}/>)
        }
        </div>
      </div>
  )
}
