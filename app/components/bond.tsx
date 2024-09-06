import { image } from 'token-icons';

import Button from '@mui/material/Button';

import Tooltip from '../components/tooltip';
import imageMapping from '../../constants/toImageMapping.json';
import decimalMapping from '../../constants/toDecimalsMapping.json';

function convertHours(hours) {
  const units = [
    { label: 'year', hours: 24 * 365 },
    { label: 'month', hours: 24 * 30 },
    { label: 'week', hours: 24 * 7 },
    { label: 'day', hours: 24 }
  ];

  for (let { label, hours: unitHours } of units) {
    if (hours >= unitHours) {
      let value = Math.floor(hours / unitHours);
      return `${value} ${label}${value > 1 ? 's' : ''}`;
    }
  }

  return `${Math.floor(hours)} hour${hours > 1 ? 's' : ''}`;
}

function formatTokenAmount(amount, decimals) {
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

export default function Bond({ data, type }) {
  let itemClass = 'flex items-center h-full p-3 border-2 border-transparent border-r-sky-500 hover:bg-gray-100 dark:hover:bg-gray-600';
  let actionClass = 'flex justify-end items-center h-full w-full pr-2';
  let buttonClass = 'm-3 px-3 py-2 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 active:bg-sky-300 dark:active:bg-sky-700 rounded-md';
  let coinClass = 'pr-2 dark:text-white';
  let coinWidth = ' w-44';
  let percentageWidth = ' w-16';
  let timeWidth = ' w-28';
  let amountClass = 'dark:text-white';

  let timeLeft = ((parseInt(data[4]) + (parseInt(data[2]) * 3600)) - (Date.now() / 1000)) / 3600;
  return (
    <>
    <div className="flex justify-between items-center h-14 min-w-max m-2 p-0 border-transparent rounded-md bg-white dark:bg-gray-700 shadow-xl">
      <div className='flex justify-start items-center'>
        <Tooltip text="the collatral that was used"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[data[6]])} /><a className={amountClass}>{formatTokenAmount(parseInt(data[8]), decimalMapping[data[6]])}</a></div></Tooltip>
        <Tooltip text="the borrowed coin"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[data[7]])} /><a className={amountClass}>{formatTokenAmount(parseInt(data[9]), decimalMapping[data[7]])}</a></div></Tooltip>
        <Tooltip text="the borrowed token balance"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[data[7]])} /><a className={amountClass}>{formatTokenAmount(parseInt(data[9] - data[10]), decimalMapping[data[7]])}</a></div></Tooltip>        
        <Tooltip text="the time until the bond is liquidated"><div className={itemClass + timeWidth}><a className={amountClass}>{convertHours(timeLeft)}</a></div></Tooltip>
        <Tooltip text="the intrest rate of the bond (simple intrest)"><div className={itemClass + percentageWidth}><a className={amountClass}>{`${parseInt(data[3])}%`}</a></div></Tooltip>
        <Tooltip text="the collatralization percentage (bonds liquidate at 90%)"><div className={itemClass + percentageWidth}><a className={amountClass}>{`${parseInt(data[13])}%`}</a></div></Tooltip>
      </div>
      <div>
        <div className={actionClass}><a className="bg-sky-500 hover:bg-sky-400 text-white rounded-md p-2 px-4" href={`/dashboard/${type}?id=${type == 'borrower' ? data[0] : data[1]}`}>Details</a></div>
        </div> 
    </div>
    </>
  );
}
