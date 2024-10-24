'use client';

import { useEffect, useState } from 'react';

import Bond from '../components/bond.tsx';
import Status from '../components/status';
import BondRequest from '../components/bondRequest';
import BondPage from './subPages/bondPage';

export default function Dashboard({ contract }) {
  const [ids, setIds] = useState([[],[]]);
  const [requests, setRequests] = useState([]);
  const [borrowingTokenAmounts, setBorrowingTokenAmounts] = useState([]);
  const [status, setStatus] = useState({code: 'loading', data: ''});
  const [selectedBond, selectBond] = useState({type: "", id: 0});

  const getData = async () => {
    try {
      await contract.setup();
      await contract.ensureLocalNodeNetwork();
      await contract.ensureSignerAvailable();
      await setIds(await contract.getNFTData());

      const newBorrowingTokenAmounts = [];
      let newRequests = contract.get2dArray(await contract.getBondRequests());
      newRequests = newRequests.filter((request) => request[0] == contract.int.signer.address);

      for (let i = 0; i < newRequests.length; i++) {
        newBorrowingTokenAmounts[i] = parseInt(await contract.getRequiredAmountForRequest(newRequests[i]));
      }

      setRequests(newRequests);
      setBorrowingTokenAmounts(newBorrowingTokenAmounts);
      setStatus({code: 'ok', data: ''});
    } catch (error) {
      console.log(error);
      let processedError = error.toString().split('(')[0].split('Error: ')[1];
      setStatus({code: 'error', data: processedError});
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const cancelFunction = async(request) => {
    setStatus({code: 'loading', data: ''});

    await contract.setup();
    await contract.ensureLocalNodeNetwork();
    await contract.ensureSignerAvailable();

    await contract.cancelBondRequest(request);

    getData();
  }

  const reset = async() => {
    await selectBond({type: "", id: 0});
    await setStatus({code: 'loading', data: ''});
    getData();
  }

  return (
    <>
    { (selectedBond.type == '') ? 
    (<div className="flex flex-col flex-grow h-screen p-5 bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <h1 className="text-3xl dark:text-white pb-2 min-h-10">Dashboard</h1>
        <div className="h-0 border border-sky-500"></div>
        <div className="pt-4">
          {(status.code == 'ok') ? (<div>
            <h1 className="text-3xl dark:text-white mb-2">borrower NFTs</h1>
              <div className="h-0 border border-sky-500"></div>
              {(ids[0].length == 0) ? <div className="flex justify-center items-center h-20 w-full dark:text-white text-lg">
                there are no borrower NFTs
              </div> : (
                  ids[0].map((id, index) => {
                    return <Bond selectBond={selectBond} data={id} type="borrower" key={index} />
                  })
                )}
              <h1 className="text-3xl dark:text-white mb-2">lender NFTs</h1>
              <div className="h-0 border border-sky-500"></div>
              {(ids[0].length == 0) ? <div className="flex justify-center items-center h-20 w-full dark:text-white text-lg">
                there are no lender NFTs
              </div> : (
                  ids[1].map((id, index) => {
                    return <Bond selectBond={selectBond} data={id} type="lender" key={index} />
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
      </div>) : (<BondPage reset={reset} contract={contract} type={selectedBond.type} id={selectedBond.id}/>)
    }
    </>
  );
}
