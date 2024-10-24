function Virtical({ text, index, setIndex }) {
  let charecters = text.split('');
  return (  
    <div onClick={() => {setIndex(index)}} className="py-2 flex flex-col items-center border-2 border-transparent border-b-sky-500 hover:bg-gray-200 hover:dark:bg-gray-600 active:bg-gray-300 active:dark:bg-gray-500">
      {charecters.map((char, index) => { return (<div className="text-xl text-gray-700 dark:text-white p-0" key={index}>{char}</div>)})}
    </div>
  )
}

export default function Navbar({ setIndex }) {
  return (
    <div className="pb-2 min-w-10 h-screen bg-gray-100 dark:bg-gray-700 shadow-xl overflow-auto"> 
      <Virtical text="HOME" index={0} setIndex={setIndex}/>
      <Virtical text="BORROW" index={1} setIndex={setIndex}/>
      <Virtical text="LEND" index={2} setIndex={setIndex}/>
      <Virtical text="DASHBOARD" index={3} setIndex={setIndex}/>
    </div>
  );
}
