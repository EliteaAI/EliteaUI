import { useProjectType } from '@/[fsd]/shared/lib/hooks';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

export const useCanWriteIndexes = () => {
  const { isPrivate } = useProjectType();
  const { checkPermission } = useCheckPermission();

  return isPrivate || checkPermission(PERMISSIONS.index.edit);
};
