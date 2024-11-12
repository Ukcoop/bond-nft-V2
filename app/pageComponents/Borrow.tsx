'use client';

import { useEffect, useState } from 'react';

import toDecimalsMapping from '../../constants/toDecimalsMapping.json';
import toImageMapping from '../../constants/toImageMapping.json';
import { image } from 'token-icons';

import { formatTokenAmount } from '../core/shared.ts';

import DropDownMenu from '../components/dropdownMenu';
import InputField from '../components/inputField';

import Slider from '@mui/material/Slider';
import Button from '../components/button';
import Status from '../components/status';



export default function Borrow({ contract, setIndex }) {
  const [status, setStatus] = useState({code: 'loading', data: ''});
  const [coinOptions, setCoinOptions] = useState([]);
  const [collatralToken, setCollatralToken] = useState({key: 'null', component: (<div className="mx-2">nothing selected</div>)});
  const [collatralAmount, setCollatralAmount] = useState(0);
  const [borrowingToken , setBorrowingToken] = useState({key: 'null', component: (<div className="mx-2">nothing selected</div>)});
  const [collatraliztionRate, setCollatralizationRate] = useState(80);
  const [durationInDays, setDurationInDays] = useState(1);
  const [intrestYearly, setIntrestYearly] = useState(5);

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

  const reset = () => {
    setIndex(3);
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
      if(parseInt(durationInDays) < 1 || parseInt(durationInDays) > 365) throw new Error('duration is not in range: (1 to 365 days)');

      let request = [
        collatralToken.key,
        BigInt(collatralAmount * 10 ** toDecimalsMapping[collatralToken.key]),
        borrowingToken.key,
        BigInt(collatraliztionRate),
        BigInt(parseInt(durationInDays)),
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
    <div className="flex flex-col flex-grow h-screen p-5 bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <h1 className="text-3xl dark:text-white pb-2 min-h-10">borrow</h1>
        <div className="h-0 border border-sky-500"></div>
        <div className="flex flex-row w-max overflow-wrap">
          <div className="flex flex-col w-max p-2 mr-2">
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
          <div className="flex flex-col justify-between w-max p-2">
            <div>
              <h1 className="text-2xl dark:text-white my-2">paramiters</h1>
              <div className="h-0 mb-5 border-2 border-transparent border-t-sky-500"></div>
              <h1 className="text-md dark:text-white">duration in days</h1>
              <InputField type="number" value={durationInDays} setValue={setDurationInDays} onKeyPress={ensureInt} min="24" />
              <h1 className="text-md dark:text-white">intrest rate</h1>
              <Slider className="text-sky-500" value={intrestYearly} onChange={(e) => { setIntrestYearly(e.target.value) }} defaultValue={intrestYearly} min={2} max={15} aria-label="Small" valueLabelDisplay="auto" />
            </div>
            <div className="w-full">
              {(status.code !== 'ok') && <Status status={status} />}
              <Button text="Borrow" style="primary" onClick={onClick}/>
            </div>
          </div>
        </div>
      </div>
  );
}
