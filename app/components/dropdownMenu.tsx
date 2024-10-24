'use client';

import { useState } from 'react';

export default function DropdownMenu({ options, select, selected }) {
  const [isVisable, setIsVisable] = useState(false);
  let styleClass = 'w-full h-10 dark:text-white shadow-xl border border-transparent';
  let selectedColor = ' bg-sky-200 dark:bg-gray-600';
  let notSelectedColor = ' bg-sky-100 dark:bg-slate-900';
  let defaultClass = ' rounded-md';
  let notEnd = ' border-b-sky-500';
  let start  = ' border-b-sky-500 rounded-t-md';
  let end = ' rounded-b-md';

  const onSelection = (selection) => {
    select(selection);
    setIsVisable(false);
  }

  return (
    <div className="relative inline-block overflow-visible mb-2">
      <div className={styleClass + notSelectedColor + defaultClass + ' flex flex-row items-center mb-2'} onClick={() => setIsVisable(!isVisable)}>{selected.component}</div>
      {isVisable && <div className="absolute z-10 top-full w-full"> 
        {options.map((option, index) => {
          return <div key={index} className={styleClass + ((option.component.props.children == selected.component.props.children) ? selectedColor : notSelectedColor) + ((index == options.length - 1) ? end : ((index == 0) ? start : notEnd))} onClick={() => onSelection(option)}>{option.component}</div>
        })}
      </div>
      }
    </div>
  );
}
