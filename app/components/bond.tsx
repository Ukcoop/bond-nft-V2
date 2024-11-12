import { image } from 'token-icons';

import Button from './button';

import Tooltip from '../components/tooltip';
import imageMapping from '../../constants/toImageMapping.json';
import decimalMapping from '../../constants/toDecimalsMapping.json';

import { formatTokenAmount, parseDays } from '../core/shared.ts';

export default function Bond({ selectBond, data, type }) {
  let itemClass = 'flex items-center h-full p-3 border-2 border-transparent border-r-sky-500 hover:bg-gray-100 dark:hover:bg-slate-800';
  let durationClass = 'flex items-center h-full border-2 border-transparent border-r-sky-500 hover:bg-gray-100 dark:hover:bg-slate-800';  
  let actionClass = 'flex justify-end items-center h-full w-full pr-2';
  let buttonClass = 'm-3 px-3 py-2 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 active:bg-sky-300 dark:active:bg-sky-700 rounded-md';
  let coinClass = 'pr-2 dark:text-white';
  let coinWidth = ' w-44';
  let percentageWidth = ' w-16';
  let timeWidth = ' w-28';
  let amountClass = 'dark:text-white';

  let timeLeft = ((parseInt(data[4]) + (parseInt(data[2]) * 3600)) - (Date.now() / 1000)) / 3600 / 24;
  let durationArray = parseDays(timeLeft).split(', ');  
  return (
    <>
      <div className="flex justify-between items-center h-14 min-w-max m-2 p-0 pl-1 border-transparent rounded-md bg-white dark:bg-slate-900 shadow-xl">
        <div className='flex justify-start items-center'>
          <Tooltip text="the collatral that was used"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[data[6]])} /><a className={amountClass}>{formatTokenAmount(parseInt(data[8]), decimalMapping[data[6]])}</a></div></Tooltip>
          <Tooltip text="the borrowed coin"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[data[7]])} /><a className={amountClass}>{formatTokenAmount(parseInt(data[9]), decimalMapping[data[7]])}</a></div></Tooltip>
          <Tooltip text="the borrowed token balance"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[data[7]])} /><a className={amountClass}>{formatTokenAmount(parseInt(data[9] - data[10]), decimalMapping[data[7]])}</a></div></Tooltip>        
          <Tooltip text="the time until the bond is liquidated"><div className={'flex flex-col max-h-14 ' + durationClass + timeWidth}>{
            durationArray.map((item, index) =>{return (<a key={index} className={'text-xs ' + amountClass}>{item}</a>)})
          }</div></Tooltip>
          <Tooltip text="the intrest rate of the bond (simple intrest)"><div className={itemClass + percentageWidth}><a className={amountClass}>{`${parseInt(data[3])}%`}</a></div></Tooltip>
          <Tooltip text="the collatralization percentage (bonds liquidate at 90%)"><div className={itemClass + percentageWidth}><a className={amountClass}>{`${parseInt(data[13])}%`}</a></div></Tooltip>
        </div>
        <div className="mr-2">
          <Button text="Details" style="primary" onClick={() => {selectBond({type, id: (type == 'borrower' ? data[0] : data[1])})}}/>  
        </div> 
      </div>
      </>
  );
}
