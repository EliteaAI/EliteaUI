import { ENVIRONMENT_KEYS } from '@/[fsd]/shared/lib/constants/environment.constants';

export { ENVIRONMENT_KEYS, ENVIRONMENT_SECTION } from '@/[fsd]/shared/lib/constants/environment.constants';

export const ENVIRONMENT_FIELD_ORDER = [
  ENVIRONMENT_KEYS.SYSTEM_SENDER_NAME,
  ENVIRONMENT_KEYS.ERROR_TOAST_DURATION,
];

export const ENVIRONMENT_FIELD_DEFAULTS = {
  [ENVIRONMENT_KEYS.ERROR_TOAST_DURATION]: {
    minimum: 5000,
    maximum: 20000,
  },
};
