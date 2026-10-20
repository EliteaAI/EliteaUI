import { memo, useCallback, useState } from 'react';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useLazyExportSchedulesQuery } from '@/[fsd]/entities/schedule';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ImportIcon from '@/assets/import-icon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage, downloadBlobFile } from '@/common/utils';
import ExportIcon from '@/components/Icons/ExportIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import ImportSchedulesDialog from './ImportSchedulesDialog';

const ScheduleImportExportActions = memo(({ projectId }) => {
  const { checkPermission } = useCheckPermission();
  const { toastError } = useToast();
  const [exportSchedules, { isFetching }] = useLazyExportSchedulesQuery();
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleExport = useCallback(async () => {
    const { data, error } = await exportSchedules({ projectId });
    if (error) toastError(buildErrorMessage(error));
    else downloadBlobFile(data.blob, data.filename);
  }, [exportSchedules, projectId, toastError]);
  const openImport = useCallback(() => setIsImportOpen(true), []);
  const closeImport = useCallback(() => setIsImportOpen(false), []);

  const canExport = checkPermission(PERMISSIONS.schedules.export);
  const canImport = checkPermission(PERMISSIONS.schedules.import);

  return (
    <>
      {canExport && (
        <StyledTooltip
          title="Export"
          placement="top"
        >
          <Button.BaseBtn
            data-testid="schedules-export-button"
            variant={BUTTON_VARIANTS.iconLabel}
            onClick={handleExport}
            disabled={isFetching}
            startIcon={<ExportIcon />}
          >
            Export
          </Button.BaseBtn>
        </StyledTooltip>
      )}
      {canImport && (
        <StyledTooltip
          title="Import"
          placement="top"
        >
          <Button.BaseBtn
            data-testid="schedules-import-button"
            variant={BUTTON_VARIANTS.iconLabel}
            onClick={openImport}
            startIcon={<ImportIcon />}
          >
            Import
          </Button.BaseBtn>
        </StyledTooltip>
      )}
      {canImport && isImportOpen && (
        <ImportSchedulesDialog
          open
          onClose={closeImport}
          projectId={projectId}
        />
      )}
    </>
  );
});

ScheduleImportExportActions.displayName = 'ScheduleImportExportActions';

export default ScheduleImportExportActions;
