export default function Button({ text, style, onClick }) {
  const styles = {
    primary: 'flex items-center justify-center w-full min-h-10 bg-sky-500 hover:bg-sky-400 text-white rounded-md p-2 px-4',
    secondary: 'flex items-center justify-center w-full min-h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 hover:dark:bg-gray-600 text-white rounded-md p-2 px-4',
    warning: 'flex items-center justify-center w-full min-h-10 bg-red-500 hover:bg-red-400 text-white rounded-md p-2 px-4'
  }

  return (
    <div className={styles[style]} onClick={onClick}><a>{text}</a></div>
  );
}
