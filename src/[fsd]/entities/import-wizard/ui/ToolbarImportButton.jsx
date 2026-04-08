import { memo } from 'react';

import { useSelector } from 'react-redux';

import { IconButton } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useImport } from '@/[fsd]/entities/import-wizard/lib/hooks';
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
      <IconButton
        onClick={openFileDialog}
        size="small"
        sx={styles.importBtn}
      >
        <ImportIcon />
      </IconButton>
    </StyledTooltip>
  );
});

ToolbarImportButton.displayName = 'ToolbarImportButton';

/** @type {MuiSx} */
const importButtonStyles = () => ({
  importBtn: theme => ({
    ml: 1,
    padding: '.5rem',
    borderRadius: '.5rem',
    backgroundColor: theme.palette.background.button.secondary,

    '&:hover': {
      backgroundColor: theme.palette.background.button.secondary,
      opacity: 0.8,
    },

    svg: {
      fontSize: '1rem',
      width: '1rem',
      height: '1rem',

      path: {
        fill: theme.palette.icon.fill.secondary,
      },
    },
  }),
});

export default ToolbarImportButton;
