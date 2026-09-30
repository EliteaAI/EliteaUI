import { ProjectBackupConstants } from '@/[fsd]/features/settings/lib/constants';

const { RESTORE_OPTION_LABELS } = ProjectBackupConstants;

export const formatSize = bytes => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

// The backend phrases restore errors for API clients (field names such as
// allow_project_mismatch, codes such as access_denied); translate the ones the
// dialog can trigger into the wording of its own controls
export const getRestoreErrorMessage = error => {
  const data = error?.data;

  // The artifact is what the dialog needs to offer the checkbox; the parameter
  // name in the text is a fallback in case the payload shape changes
  if (error?.status === 409 && (data?.artifact || data?.error?.includes('allow_project_mismatch'))) {
    return `This backup was taken from another project. Check "${RESTORE_OPTION_LABELS.allowMismatch}" to restore it into this project.`;
  }

  if (data?.error === 'access_denied') {
    return 'You do not have permission to restore data into this project.';
  }

  const message = data?.error ?? error?.error ?? 'Restore failed.';
  return data?.detail ? `${message}: ${data.detail}` : message;
};
