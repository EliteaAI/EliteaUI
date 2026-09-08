import { FOLDER_PERMISSION_OPTIONS } from '../constants';

export const isFolderWritable = folder =>
  folder?.access_level === FOLDER_PERMISSION_OPTIONS.READ_WRITE ||
  folder?.access_level === FOLDER_PERMISSION_OPTIONS.FULL ||
  !folder?.access_level;
