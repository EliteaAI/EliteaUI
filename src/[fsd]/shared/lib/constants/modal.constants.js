import WarningIcon from '@/assets/attention-icon.svg?react';
import ErrorIcon from '@/assets/error-icon.svg?react';
import InfoIcon from '@/assets/info.svg?react';
import SuccessIcon from '@/assets/success-icon.svg?react';

export const MODAL_VARIANT = {
  simple: 'simple',
  complex: 'complex',
};

export const MODAL_ICON_TYPE = {
  destructive: 'destructive',
  warning: 'warning',
  info: 'info',
  success: 'success',
};

export const MODAL_ICONS = {
  [MODAL_ICON_TYPE.destructive]: ErrorIcon,
  [MODAL_ICON_TYPE.warning]: WarningIcon,
  [MODAL_ICON_TYPE.info]: InfoIcon,
  [MODAL_ICON_TYPE.success]: SuccessIcon,
};

export const MODAL_ICON_COLOR_KEYS = {
  [MODAL_ICON_TYPE.destructive]: 'error',
  [MODAL_ICON_TYPE.warning]: 'warning',
  [MODAL_ICON_TYPE.info]: 'info',
  [MODAL_ICON_TYPE.success]: 'successModal',
};

export const MODAL_ICON_SIZE = { width: '1.25rem', height: '1.25rem' };
