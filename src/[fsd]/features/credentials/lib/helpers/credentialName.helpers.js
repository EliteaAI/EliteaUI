import { capitalizeFirstChar } from '@/common/utils';

export function extraCredentialName(name) {
  return capitalizeFirstChar(
    name
      .replace('integration_', '')
      .replace(/.*Provider_/, '')
      .replace(/_/g, ' '),
  ).trim();
}
