import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import ExportIcon from '@/components/Icons/ExportIcon';
import useToast from '@/hooks/useToast';
import { useExport } from '@/pages/Common/Components/useExport';
import { useTheme } from '@emotion/react';

const useExportToolkit = () => {
  const { values: { id, name, owner_id } = {} } = useFormikContext();
  const { toastError } = useToast();
  const { doExport, isExporting } = useExport({
    id,
    name,
    entity_name: 'toolkits',
    owner_id,
    toastError,
  });

  const onExport = useCallback(async () => {
    doExport({ isDial: false })();
  }, [doExport]);

  return {
    isExporting,
    onExport,
  };
};

export const useExportToolkitMenu = ({ disabled = false } = {}) => {
  const theme = useTheme();
  const { isExporting, onExport } = useExportToolkit();
  const menuItem = useMemo(
    () => ({
      label: 'Export',
      icon: (
        <>
          <ExportIcon
            sx={{ fontSize: '1rem' }}
            fill={theme.palette.icon.fill.default}
          />
          {isExporting && <StyledCircleProgress size={16} />}
        </>
      ),
      disabled,
      onClick: onExport,
    }),
    [disabled, isExporting, onExport, theme.palette.icon.fill.default],
  );

  return {
    exportToolkitMenuItem: menuItem,
  };
};

export default function ExportToolkitButton({ disabled = false }) {
  const theme = useTheme();
  const { isExporting, onExport } = useExportToolkit();

  return (
    <Tooltip
      title={'Export toolkit'}
      placement="top"
    >
      <IconButton
        aria-label={'export toolkit'}
        variant="elitea"
        color="secondary"
        disabled={disabled}
        onClick={onExport}
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
