import { memo } from 'react';

import { useSelector } from 'react-redux';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useImport } from '@/[fsd]/entities/import-wizard/lib/hooks';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import ImportIcon from '@/assets/import-icon.svg?react';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

const ToolbarImportButton = memo(() => {
  const styles = importButtonStyles();

  const { projects } = useSelector(state => state.settings);

  const { openFileDialog } = useImport();

  if (!projects?.filter(({ id }) => id != PUBLIC_PROJECT_ID).length) return null;

  return (
    <StyledTooltip
      title="Import"
      placement="top"
    >
      <BaseBtn
        variant="secondary"
        onClick={openFileDialog}
        sx={styles.importBtn}
        startIcon={<ImportIcon />}
      />
    </StyledTooltip>
  );
});

ToolbarImportButton.displayName = 'ToolbarImportButton';

/** @type {MuiSx} */
const importButtonStyles = () => ({
  importBtn: {
    ml: 1,
    width: '2rem',
    height: '2rem',
  },
});

export default ToolbarImportButton;
