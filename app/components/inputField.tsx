export default function InputField({ type, value, setValue, min = '', onKeyPress = (() => {}) }) {
  return (
    <div className="w-full mb-2">
      <input className="w-full h-10 pl-2 text-2xl dark:text-white bg-sky-100 dark:bg-gray-800 border border-transparent shadow-xl rounded-md outline-none focus:border-sky-500" 
        type={type}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        min={min}
        onKeyPress={onKeyPress}
      />
      <p>{/*place for errors*/}</p>
    </div>
  );
}
