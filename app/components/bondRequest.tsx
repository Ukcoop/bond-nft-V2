import { image } from 'token-icons';

import Button from './button';

import Tooltip from './tooltip';
import imageMapping from '../../constants/toImageMapping.json';
import decimalMapping from '../../constants/toDecimalsMapping.json';

import { formatTokenAmount, parseDays } from '../core/shared.ts';

export default function BondRequest({ request, borrowingAmount, cancel = false, action = (temp: any) => {} }) {
  let bondClass = `flex justify-between items-center h-14 min-w-max${cancel ? ' w-full' : ''} m-2 p-0 pl-1 border-transparent rounded-md bg-white dark:bg-slate-900 shadow-xl`;
  let itemClass = 'flex items-center h-full p-3 border-2 border-transparent border-r-sky-500 hover:bg-gray-100 dark:hover:bg-slate-800';
  let durationClass = 'flex items-center h-full border-2 border-transparent border-r-sky-500 hover:bg-gray-100 dark:hover:bg-slate-800';  
  let actionClass = 'px-2 flex justify-end items-center h-full w-full';
  let buttonClass = 'm-3 px-3 py-2 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 active:bg-sky-300 dark:active:bg-sky-700 rounded-md';
  let coinClass = 'pr-2 dark:text-white';
  let coinWidth = ' w-44';
  let percentageWidth = ' w-16';
  let timeWidth = ' w-28';
  let amountClass = 'dark:text-white';

  let bondRequestEncoded = btoa(request.toString());
  let durationArray = parseDays(parseInt(request[5])).split(', ');

  return (
    <>
    <div className={bondClass}>
      <div className='flex justify-start items-center'>
        <Tooltip text="the coin used for collatral"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[request[1]])} /><a className={amountClass}>{formatTokenAmount(parseInt(request[2]), decimalMapping[request[1]])}</a></div></Tooltip>
        <Tooltip text="the borrowed coin"><div className={itemClass + coinWidth}><img className="h-6 mr-1" alt="" src={image(imageMapping[request[3]])} /><a className={amountClass}>{formatTokenAmount(borrowingAmount, decimalMapping[request[3]])}</a></div></Tooltip>
        <Tooltip text="the percentage of the collatral value being borrowed"><div className={itemClass + percentageWidth}><a className={amountClass}>{`${parseInt(request[4])}%`}</a></div></Tooltip>
        <Tooltip text="the duration of the bond"><div className={'flex flex-col min-h-14 justify-center ' + durationClass + timeWidth}>{
            durationArray.map((item, index) =>{return (<a key={index} className={'text-xs ' + amountClass}>{item}</a>)})
          }</div></Tooltip>
        <Tooltip text="the intrest rate of the bond (simple intrest)"><div className={itemClass + percentageWidth}><a className={amountClass}>{`${parseInt(request[6])}%`}</a></div></Tooltip>
      </div>
      <div>
        { cancel ? <div className={actionClass}><Button text="Cancel bond" style="warning" onClick={async() => {await action(request)}}/></div>
        : <div className={actionClass}><Button text="Lend" style="primary" onClick={() => {action(request)}}/></div>
        }
      </div>
    </div>
    </>
  );
}
