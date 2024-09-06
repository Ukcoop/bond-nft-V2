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

export default function BondRequest({ request, borrowingAmount, cancel = false, cancelFunction = () => {} }) {
  let itemClass = 'flex items-center h-full p-3 border-2 border-transparent border-r-sky-500 hover:bg-gray-100 dark:hover:bg-gray-600';
  let actionClass = 'px-2 flex justify-end items-center h-full w-full';
  let buttonClass = 'm-3 px-3 py-2 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 active:bg-sky-300 dark:active:bg-sky-700 rounded-md';
  let coinClass = 'pr-2 dark:text-white';
  let coinWidth = ' w-44';
  let percentageWidth = ' w-16';
  let timeWidth = ' w-28';
  let amountClass = 'dark:text-white';

  let bondRequestEncoded = btoa(request.toString());

  return (
    <>
    <div className="flex justify-between items-center h-14 min-w-max m-2 p-0 border-transparent rounded-md bg-white dark:bg-gray-700 shadow-xl">
      <div className='flex justify-start items-center'>
        <Tooltip text="the coin used for collatral"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[request[1]])} /><a className={amountClass}>{formatTokenAmount(parseInt(request[2]), decimalMapping[request[1]])}</a></div></Tooltip>
        <Tooltip text="the borrowed coin"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[request[3]])} /><a className={amountClass}>{formatTokenAmount(borrowingAmount, decimalMapping[request[3]])}</a></div></Tooltip>
        <Tooltip text="the percentage of the collatral value being borrowed"><div className={itemClass + percentageWidth}><a className={amountClass}>{`${parseInt(request[4])}%`}</a></div></Tooltip>
        <Tooltip text="the duration of the bond"><div className={itemClass + timeWidth}><a className={amountClass}>{convertHours(parseInt(request[5]))}</a></div></Tooltip>
        <Tooltip text="the intrest rate of the bond (simple intrest)"><div className={itemClass + percentageWidth}><a className={amountClass}>{`${parseInt(request[6])}%`}</a></div></Tooltip>
      </div>
      <div>
        { cancel ? <div className={actionClass}><a className="bg-red-500 hover:bg-red-400 text-white rounded-md p-2 px-4" onClick={async() => {await cancelFunction(request)}}>CANCEL</a></div>
        : <div className={actionClass}><a className="bg-sky-500 hover:bg-sky-400 text-white rounded-md p-2 px-4" href={`/lend/new?bondRequest=${bondRequestEncoded}`}>Lend</a></div>
        }
      </div>
    </div>
    </>
  );
}
