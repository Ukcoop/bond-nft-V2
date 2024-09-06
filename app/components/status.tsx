import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

export default function Status({ status }) {
  let base = 'flex items-center w-full min-h-10 rounded-md mb-2 p-2';

  let codes = {
    loading: (<div className={base + ' bg-blue-500 text-white'}><HourglassEmptyIcon />please wait</div>),
    success: (<div className={base + ' bg-green-500 text-white'}><DoneIcon />{status.data}</div>),
    error: (<div className={base + ' bg-red-500 text-white'}><CloseIcon />{status.data}</div>)
  }

  return codes[status.code];
}
