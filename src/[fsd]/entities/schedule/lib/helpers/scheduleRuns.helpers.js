import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import TimerOffOutlinedIcon from '@mui/icons-material/TimerOffOutlined';

// The one table of run statuses: the card, the chip, the details and Run History read the label, the colour
// and the icon from here. The API stores the pause for a person's answer as waiting_for_approval; the owner
// calls it "Awaiting approval". Running has no icon: it shows a spinner. The colours are MUI palette paths.
// In the entities layer, so the run history list can label a schedule run.
export const RUN_STATUS_META = {
  success: { label: 'Success', color: 'success.main', Icon: CheckCircleOutlineIcon },
  failed: { label: 'Failed', color: 'error.main', Icon: HighlightOffIcon },
  running: { label: 'Running...', color: 'info.main', Icon: null, isSpinner: true },
  waiting_for_approval: { label: 'Awaiting approval', color: 'warning.main', Icon: PauseCircleOutlineIcon },
  waiting_for_input: { label: 'Waiting for input', color: 'warning.main', Icon: HourglassEmptyIcon },
  expired: { label: 'Expired', color: 'warning.main', Icon: TimerOffOutlinedIcon },
  blocked: { label: 'Blocked', color: 'error.main', Icon: BlockIcon },
  cancelled: { label: 'Cancelled', color: 'text.secondary', Icon: StopCircleOutlinedIcon },
  skipped: { label: 'Skipped', color: 'text.secondary', Icon: SkipNextIcon },
};

export const toWord = value => (value ? `${value[0].toUpperCase()}${value.slice(1).replace(/_/g, ' ')}` : '');

export const toRunStatusLabel = status => RUN_STATUS_META[status]?.label ?? toWord(status);

// An unknown status gets a label made from its words and no icon
export const toRunStatusMeta = status =>
  RUN_STATUS_META[status] ?? { label: toWord(status), color: 'text.secondary', Icon: null };
