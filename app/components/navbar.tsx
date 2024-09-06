export default function Navbar({ transparent = false }) {
  return (
    <div className={`flex items-center justify-between px-2 w-full h-12 ${transparent ? 'bg-transparent' : 'bg-slate-100 dark:bg-slate-900'} border-2 border-transparent border-b-sky-500`}>
      <a className="text-3xl dark:text-white" href="/">Bond NFT</a>
      <div>
        <a className="text-xl dark:text-white p-2" href="/lend">Lend</a>
        <a className="text-xl dark:text-white p-2" href="/borrow">borrow</a>
        <a className="text-xl dark:text-white p-2" href="/dashboard">dashboard</a>
      </div>
    </div>
  ); 
}
