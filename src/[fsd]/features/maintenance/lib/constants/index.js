import { getEnvVar } from '@/utils/env';

export const VITE_MAINTENANCE_MESSAGE = getEnvVar('VITE_MAINTENANCE_MESSAGE');
export const VITE_MAINTENANCE_START = getEnvVar('VITE_MAINTENANCE_START');
export const VITE_MAINTENANCE_END = getEnvVar('VITE_MAINTENANCE_END');

export const VITE_MAINTENANCE_BANNER = getEnvVar('VITE_MAINTENANCE_BANNER');
