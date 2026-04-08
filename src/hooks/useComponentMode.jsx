import { ComponentMode } from '@/common/constants';

export default function useComponentMode(mode) {
  return {
    isCreate: mode === ComponentMode.CREATE,
    isEdit: mode === ComponentMode.EDIT,
    isView: mode === ComponentMode.VIEW,
  };
}
