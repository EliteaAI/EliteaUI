import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import ExportIcon from '@/components/Icons/ExportIcon.jsx';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import useToast from '@/hooks/useToast';
import { ExportFormat, useExport } from '@/pages/Common/Components/useExport';
import { useTheme } from '@emotion/react';

const useExportApplication = () => {
  const isFromPipeline = useIsFromPipelineDetail();
  const { values: { id, name, owner_id, versions, version_id, version_details } = {} } = useFormikContext();
  const { toastError } = useToast();
  const { doExport, isExporting } = useExport({
    id,
    name,
    entity_name: 'applications',
    owner_id,
    toastError,
    versions,
    // version_id may not be set directly in formik values, fall back to version_details.id
    currentVersionId: version_id ?? version_details?.id,
  });

  const onExport = useCallback(async () => {
    doExport({ format: ExportFormat.MD })();
  }, [doExport]);

  return {
    isFromPipeline,
    isExporting,
    onExport,
  };
};

export const useExportApplicationMenu = () => {
  const { isExporting, onExport } = useExportApplication();

  const menuItem = useMemo(
    () => ({
      label: 'Export',
      icon: (
        <>
          <ExportIcon sx={{ fontSize: '1rem' }} />
          {isExporting && <StyledCircleProgress size={16} />}
        </>
      ),
      disabled: false,
      onClick: onExport,
    }),
    [isExporting, onExport],
  );

  // For backward compatibility
  const menuItems = useMemo(() => [menuItem], [menuItem]);

  return {
    exportApplicationMenuItem: menuItem,
    exportApplicationMenuItems: menuItems,
  };
};

export default function ExportApplicationButton() {
  const theme = useTheme();
  const { isFromPipeline, isExporting, onExport } = useExportApplication();

  const entityType = !isFromPipeline ? 'agent' : 'pipeline';

  return (
    <Tooltip
      title={`Export ${entityType}`}
      placement="top"
    >
      <IconButton
        aria-label={`export ${entityType}`}
        variant="elitea"
        color="secondary"
        onClick={onExport}
        disabled={isExporting}
        sx={{ marginLeft: '0px' }}
      >
        <ExportIcon
          sx={{ fontSize: '1rem' }}
          fill={theme.palette.icon.fill.secondary}
        />
        {isExporting && <StyledCircleProgress size={16} />}
      </IconButton>
    </Tooltip>
  );
}
