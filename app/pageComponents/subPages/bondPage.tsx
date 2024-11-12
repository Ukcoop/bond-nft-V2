'use client';

import { useEffect, useState } from 'react';

import Button from '../../components/button';
import InputField from '../../components/inputField';
import Status from '../../components/status';

import { formatTokenAmount, parseDays } from '../../core/shared.ts';

import toDecimalsMapping from '../../../constants/toDecimalsMapping.json';
import toImageMapping from '../../../constants/toImageMapping.json';
import { image } from 'token-icons';

export default function BondPage({ reset, contract, type, id }) {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({code: 'loading', data: ''});
  const [altStatus, setAltStatus] = useState({code: 'ok', data: ''});
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  useEffect(() => {
    const getData = async () => {
      try {
        await contract.setup();
        await contract.ensureLocalNodeNetwork();
        let newData = await contract.getDataForNFT(id, 'borrower');
        if(newData[12]) throw new Error('this bond has been liquidated'); 
        await setData(newData);
        setStatus({code: 'ok', data: ''});
      } catch (error) {
        if(error.toString().split('Error: execution reverted (no data present; likely require(false) occurred').length > 1) {
          setStatus({code: 'error', data: 'unrecoverable error, please reset the test enviorment'});
        } else {
          let processedError = error.toString().split('(')[0].split('Error: ')[1];
          setStatus({code: 'error', data: processedError});
        }
      }
    };
    getData();
  }, []);

  const deposit = async() => {
    setAltStatus({code: 'loading', data: ''});
    await contract.setup();
    await contract.ensureLocalNodeNetwork();
    await contract.ensureSignerAvailable();

    try {
      await contract.borrowerDeposit(data, BigInt(depositAmount * 10 ** toDecimalsMapping[data[7]]));
      setAltStatus({code: 'success', data: 'transaction completed'});
      reset();
    } catch (error) {
      let processedError = error.toString().split('(')[0].split('Error: ')[1];
      setAltStatus({code: 'error', data: processedError}); 
    }
  }

  const withdraw = async() => {
    setAltStatus({code: 'loading', data: ''});
    await contract.setup();
    await contract.ensureLocalNodeNetwork();
    await contract.ensureSignerAvailable();

    try {
      await contract.borrowerWithdraw(data, BigInt(withdrawAmount * 10 ** toDecimalsMapping[data[7]]));
      setAltStatus({code: 'success', data: 'transaction completed'});
      reset();
    } catch (error) {
      console.log(error);
      let processedError = error.toString().split('(')[0].split('Error: ')[1];
      setAltStatus({code: 'error', data: processedError}); 
    }
  }

  let timeLeft = ((parseInt(data[4]) + (parseInt(data[2]) * 3600)) - (Date.now() / 1000)) / 3600 / 24;

  return (
    <div className="flex flex-col flex-grow h-screen p-5 bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div className="flex justify-between pb-2 min-h-10">
        <h1 className="text-3xl dark:text-white">{`${type} NFT #${id}`}</h1>
        <div className="w-min"><Button text="Return" style="secondary" onClick={() => {reset()}}/></div>
      </div>
        <div className="h-0 border border-sky-500"></div>
        <div className="pt-2">
          <>
            { (status.code == 'ok') ?
              (<div className="flex flex-row w-max overflow-wrap">
                <div className="flex flex-col w-max p-2 mr-2">
                  <h1 className="text-md dark:text-white mb-2">collatral</h1> 
                  <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[data[6]])} />
                    <a className="text-xl dark:text-white">{formatTokenAmount(parseInt(data[8]), toDecimalsMapping[data[6]])}</a>
                  </div>
                  <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                  <h1 className="text-md dark:text-white mb-2">borrowing</h1> 
                  <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[data[7]])} />
                    <a className="text-xl dark:text-white">{formatTokenAmount(parseInt(data[9]), toDecimalsMapping[data[7]])}</a>
                  </div>
                  <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                  <h1 className="text-md dark:text-white mb-2">time left</h1> 
                  <div className="flex items-center mb-2">
                    <a className="text-xl dark:text-white">{parseDays(timeLeft)}</a>
                  </div>
                  <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                  <h1 className="text-md dark:text-white mb-2">intrest</h1> 
                  <div className="flex items-center mb-2">
                    <a className="text-xl dark:text-white">{`${data[3]}%`}</a>
                  </div>
                  <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                  <h1 className="text-md dark:text-white mb-2">balance</h1> 
                  <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[data[7]])} />
                    <a className="text-xl dark:text-white">{formatTokenAmount(parseInt(data[9] - data[10]), toDecimalsMapping[data[7]])}</a>
                  </div>
                  <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                  <h1 className="text-md dark:text-white mb-2">collatrization percentage</h1> 
                  <div className="flex items-center mb-2">
                    <a className="text-xl dark:text-white">{`${data[13]}%`}</a>
                  </div>
                </div>
                  <>
                    { (type == 'borrower') ?
                      (<div className="flex flex-col justify-between w-max p-2 mr-2">
                        <div>
                          <h1 className="text-2xl dark:text-white mb-2">deposit</h1>
                          <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                          <InputField type="number" value={depositAmount} setValue={setDepositAmount}/>
                          <Button text="Deposit" style="primary" onClick={deposit}/>
                          <h1 className="text-2xl dark:text-white mt-2 mb-2">withdraw</h1>
                          <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                          <InputField type="number" value={withdrawAmount} setValue={setWithdrawAmount}/>
                          <Button text="Withdraw" style="primary" onClick={withdraw}/>
                        </div>
                          <Status status={altStatus}/>
                        </div>) : (
                        <div className="flex flex-col justify-between w-max p-2">
                          {!data[12] ? <div className="flex flex-col h-20 dark:text-white text-md">
                            <h1 className="text-2xl dark:text-white mb-2">NOTE</h1>
                            <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                            <a>the bond is still active, you will be able to withdraw</a>
                            <a>the coins you lent out when the bond is liquidated.</a>
                          </div> : <div className="p-2">
                              <h1 className="text-2xl dark:text-white mb-2">withdraw</h1>
                                <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div> 
                                <Button variant="contained" onClick={liquidateLenderNFT} className="w-full bg-sky-500 hover:bg-sky-400 rounded-md text-white mb-2">withdraw</Button> 
                              </div>
                          }
                          {(data[12] && altStatus.code !== 'ok') && <Status status={altStatus} />}
                        </div>
                      )
                    }
                  </>
                </div>
              ) : (<Status status={status}/>)
            }
          </>
        </div>
      </div>
  );
}
