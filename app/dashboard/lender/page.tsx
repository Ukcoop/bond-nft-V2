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

export default function NFTDashboard() {
  //let contract = new contractInterface(new browserWalletInterface());
  let contract = new contractInterface(new testWalletnterface());

  const searchParams = useSearchParams();
  let id = parseInt(searchParams.get('id'));
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({code: 'loading', data: ''});
  const [altStatus, setAltStatus] = useState({code: 'ok', data: ''});

  useEffect(() => {
    const getData = async () => {
      await contract.setup();
      await contract.ensureLocalNodeNetwork();
      try {
        let newData = await contract.getDataForNFT(id, 'lender');
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

  let timeLeft = ((parseInt(data[4]) + (parseInt(data[2]) * 3600)) - (Date.now() / 1000)) / 3600;

  const liquidateLenderNFT = async() => {
    setAltStatus({code: 'loading', data: ''});
    await contract.setup();
    await contract.ensureLocalNodeNetwork();
    await contract.ensureSignerAvailable();
    
    try {
      await contract.lenderWithdraw(id);
      setAltStatus({code: 'success', data: 'transaction completed'});
      window.location.replace('/dashboard');
    } catch (error) {
      let processedError = error.toString().split('(')[0].split('Error: ')[1];
      setAltStatus({code: 'error', data: processedError}); 
    } 
  }

  return (
    <div className="flex flex-col w-full h-screen">
      <NavBar />
      <div className="flex flex-col flex-grow w-screen flex-grow p-5 bg-slate-100 dark:bg-slate-900">
        {(status.code !== 'ok') ? (<Status status={status} />) : (<div className="flex-grow flex items-center justify-center overflow-auto min-h-max">
          <div className="flex items-stretch min-h-max min-w-max m-0 border-transparent rounded-md bg-white dark:bg-gray-700 dark:text-white shadow-xl">
            <div className="flex flex-col w-64 h-full p-2 border-2 border-transparent border-r-sky-500">
              <h1 className="text-md dark:text-white mb-2">collatral</h1> 
              <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[data[6]])} />
              <a className="text-xl">{formatTokenAmount(parseInt(data[8]), toDecimalsMapping[data[6]])}</a>
              </div>
              <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
              <h1 className="text-md dark:text-white mb-2">borrowing</h1> 
              <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[data[7]])} />
                <a className="text-xl">{formatTokenAmount(parseInt(data[9]), toDecimalsMapping[data[7]])}</a>
              </div>
              <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
              { !data[12] && <>
                <h1 className="text-md dark:text-white mb-2">time left</h1>
                <div className="flex items-center mb-2">
                  <a className="text-xl">{convertHours(timeLeft)}</a>
                </div>
                <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
              </> }
              <h1 className="text-md dark:text-white mb-2">intrest</h1> 
              <div className="flex items-center mb-2">
                <a className="text-xl">{`${data[3]}%`}</a>
              </div>
              { !data[12] && <>
                <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                <h1 className="text-md dark:text-white mb-2">balance</h1> 
                <div className="flex items-center mb-2"><img className="h-6 mr-2" alt="" src={image(toImageMapping[data[7]])} />
                  <a className="text-xl">{formatTokenAmount(parseInt(data[9] - data[10]), toDecimalsMapping[data[7]])}</a>
                </div>
                <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                <h1 className="text-md dark:text-white mb-2">collatrization percentage</h1> 
                <div className="flex items-center mb-2">
                  <a className="text-xl">{`${data[13]}%`}</a>
                </div>
              </> }
            </div>
            <div className="flex flex-col justify-between w-80 p-2">
              {!data[12] ? <div className="flex justify-center items-center h-20 w-full dark:text-white text-md">
                 the bond is still active, you will be able to withdraw the coins you lent out when the bond is liquidated.
              </div> : <div className="p-2">
                <h1 className="text-2xl dark:text-white mb-2">withdraw</h1>
                <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div> 
                <Button variant="contained" onClick={liquidateLenderNFT} className="w-full bg-sky-500 hover:bg-sky-400 rounded-md text-white mb-2">withdraw</Button> 
              </div>}
              {(data[12] && altStatus.code !== 'ok') && <Status status={altStatus} />}
            </div>
          </div>
        </div> )}
      </div>
    </div>
  );
}
