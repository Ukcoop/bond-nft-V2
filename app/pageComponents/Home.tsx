import Image from 'next/image';

import background from '../../images/mountians.jpg';

export default function Home() {
  return (
    <div className="p-8 h-screen overflow-auto">
      <h1 className="text-3xl text-white pb-2 min-h-10">Welcome to Bond NFT!</h1>
      <div className="h-0 mb-2 border-2 border-transparent border-t-sky-500"></div>
      <h1 className="text-xl text-white mb-2">Bond NFT is a decentralized bond system that allows anyone to create and fund their own bonds at their preferred rates. This enables users to borrow tokens at a fixed rate and for a fixed period, facilitating DeFi and trading activities.</h1>
      <Image src={background} alt="" fill={true} className='-z-10'/>
    </div> 
  );
}
