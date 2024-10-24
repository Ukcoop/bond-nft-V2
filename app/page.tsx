'use client';

import { useEffect, useState } from 'react';

import Navbar from './components/navbar';

import Home from './pageComponents/Home';
import Borrow from './pageComponents/Borrow';
import Lend from './pageComponents/Lend';
import Dashboard from './pageComponents/Dashboard';

import config from '../constants/config.json';

import browserWalletInterface from './core/browserWalletInterface';
import testWalletnterface from './core/testWalletInterface';
import contractInterface from './core/contractInterface';

export default function Main() {
  let contract = (config.connType == 'test') ? new contractInterface(new testWalletnterface()) : new contractInterface(new browserWalletInterface());  
  const [index, setIndex] = useState(0);

  const pages = [
    <Home/>,
    <Borrow contract={contract} setIndex={setIndex}/>,
    <Lend contract={contract}/>,
    <Dashboard contract={contract}/>
  ]

  return (
    <div className="flex flex-row h-screen">
      <Navbar setIndex={setIndex}/>
      {pages[index]}
    </div>
  )
}
