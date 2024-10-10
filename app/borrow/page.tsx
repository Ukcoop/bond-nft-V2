'use client';

import { useEffect, useState } from 'react';

import config from '../../constants/config.json';
import toDecimalsMapping from '../../constants/toDecimalsMapping.json';
import toImageMapping from '../../constants/toImageMapping.json';

import InputField from '../components/inputField';
import { image } from 'token-icons';

import NavBar from '../components/navbar';
import DropDownMenu from '../components/dropdownMenu';
import Status from '../components/status';

import browserWalletInterface from '../core/browserWalletInterface';
import testWalletnterface from '../core/testWalletInterface';
import contractInterface from '../core/contractInterface';

import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';

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

export default function Borrow() {
  let contract = (config.connType == 'test') ? new contractInterface(new testWalletnterface()) : new contractInterface(new browserWalletInterface());
  //let contract =  new contractInterface(new testWalletnterface());

  const [status, setStatus] = useState({code: 'loading', data: ''});
  const [coinOptions, setCoinOptions] = useState([]);
  const [collatralToken, setCollatralToken] = useState({key: 'null', component: (<div className="mx-2">nothing selected</div>)});
  const [collatralAmount, setCollatralAmount] = useState(0);
  const [borrowingToken , setBorrowingToken] = useState({key: 'null', component: (<div className="mx-2">nothing selected</div>)});
  const [collatraliztionRate, setCollatralizationRate] = useState(80);
  const [durationInHours, setDurationInHours] = useState(24);
  const [intrestYearly, setIntrestYearly] = useState(5);

  const reset = async() => {
    window.location.replace('/borrow');
  }

  const getCoins = async() => {
    let tokens = Object.keys(toDecimalsMapping);
    let options = [];

    try { 
      let getBalances = await contract.getBalances();
      if(getBalances == undefined) return;
      setStatus({code: 'ok', data: ''});

      for(let i = 0; i < tokens.length; i++) {
        options[i] = {key: tokens[i], component: (<div className="flex items-center justify-between px-2 w-full h-full">
          <img className="h-6 mr-1" alt="" src={image(toImageMapping[tokens[i]])} />
            <a className="text-3xl">{formatTokenAmount(parseInt(getBalances[i][1]), toDecimalsMapping[tokens[i]])}</a>
          </div>)}
      }

      setCoinOptions(options);
    } catch (error) {
      if(error.toString().split('Error: execution reverted (no data present; likely require(false) occurred').length > 1) {
        setStatus({code: 'error', data: 'unrecoverable error, please reset the test enviorment'});
      } else {
        console.log(error);
        let processedError = error.toString().split('(')[0].split('Error: ')[1];
        setStatus({code: 'error', data: processedError});
      } 
    }
  }

  useEffect(() => {
    const getData = async () => {
      setStatus({code: 'loading', data:''});

      try {
        await contract.setup();
        await contract.ensureLocalNodeNetwork();
        await contract.ensureSignerAvailable();
        await getCoins();
      } catch (error) {
        let processedError = error.toString().split('(')[0].split('Error: ')[1];
        setStatus({code: 'error', data: processedError});
      }
    };
    getData();
  }, []);


  const onClick = async () => {
    setStatus({code: 'loading', data:''});

    try {
      await contract.setup();
      await contract.ensureLocalNodeNetwork();
      await contract.ensureSignerAvailable();

      if(collatralToken.key == 'null') throw new Error('collatral coin not spesified');
      if(collatralAmount == 0) throw new Error('collatral amount not spesified');
      if(borrowingToken.key == 'null') throw new Error('borrowing coin not spesified');
      if(parseInt(durationInHours) < 24) throw new Error('duration can not be shorter than a day');

      let request = [
        collatralToken.key,
        BigInt(collatralAmount * 10 ** toDecimalsMapping[collatralToken.key]),
        borrowingToken.key,
        BigInt(collatraliztionRate),
        BigInt(parseInt(durationInHours)),
        BigInt(intrestYearly)
      ];

      let response = await (await contract.postBondRequest(request)).wait();
      setStatus({code: 'success', data:'transaction completed'});
      await reset();
    } catch (error) {
      console.log(error);
      let processedError = error.toString().split('(')[0].split('Error: ')[1];
      setStatus({code: 'error', data: processedError});
    }
  };

  const ensureInt = (event: any) => {
    if (!(event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))) {
      event.preventDefault();
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <NavBar />
        <main className="flex-grow flex flex-col w-screen p-5 bg-slate-100 dark:bg-slate-900 overflow-hidden">
          <h1 className="text-3xl dark:text-white mb-2">borrow</h1>
          <div className="h-0 border border-sky-500"></div>
          <div className="flex-grow flex items-center justify-center overflow-auto min-h-max">
            <div className="flex items-stretch h-96 min-w-max m-0 border-transparent rounded-md bg-white dark:bg-gray-700 shadow-xl">
              <div className="flex flex-col w-1/2 h-full border-2 border-transparent border-r-sky-500">
                <div className="flex flex-col items-center w-full">
                  <div className="flex flex-col w-5/6">
                    <h1 className="text-2xl dark:text-white my-2">collatral</h1>
                    <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                    <DropDownMenu options={coinOptions} select={setCollatralToken} selected={collatralToken} />
                    <h1 className="text-md dark:text-white">amount</h1>
                    <InputField type="number" value={collatralAmount} setValue={setCollatralAmount} />
                    <h1 className="text-2xl dark:text-white mb-2">borrowing</h1>
                    <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
                    <DropDownMenu options={coinOptions} select={setBorrowingToken} selected={borrowingToken} />
                    <h1 className="text-md dark:text-white">collatraliztion rate</h1>
                    <Slider className="text-sky-500" onChange={(e) => { setCollatralizationRate(e.target.value) }} defaultValue={collatraliztionRate} min={20} max={80} aria-label="Small" valueLabelDisplay="auto" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col w-1/2 h-full">
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="flex flex-col justify-between w-5/6 h-full pb-5">
                    <div>
                      <h1 className="text-2xl dark:text-white my-2">paramiters</h1>
                      <div className="h-0 mb-5 border-2 border-transparent border-b-sky-500"></div>
                      <h1 className="text-md dark:text-white">duration in hours</h1>
                      <InputField type="number" value={durationInHours} setValue={setDurationInHours} onKeyPress={ensureInt} min="24" />
                      <h1 className="text-md dark:text-white">intrest rate</h1>
                      <Slider className="text-sky-500" value={intrestYearly} onChange={(e) => { setIntrestYearly(e.target.value) }} defaultValue={intrestYearly} min={2} max={15} aria-label="Small" valueLabelDisplay="auto" />
                    </div>
                    <div className="w-full">
                      {(status.code !== 'ok') && <Status status={status} />}
                      <Button variant="contained" onClick={onClick} className="w-full bg-sky-500 hover:bg-sky-400 rounded-md text-white">borrow</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}
