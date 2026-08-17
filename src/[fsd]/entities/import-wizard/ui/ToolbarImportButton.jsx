import { memo } from 'react';

import { useSelector } from 'react-redux';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useImport } from '@/[fsd]/entities/import-wizard/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ImportIcon from '@/assets/import-icon.svg?react';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

const ToolbarImportButton = memo(props => {
  const { testId } = props ?? {};

  const { projects } = useSelector(state => state.settings);

  const { openFileDialog } = useImport();

  if (!projects?.filter(({ id }) => id != PUBLIC_PROJECT_ID).length) return null;

  return (
    <StyledTooltip
      title="Import"
      placement="top"
    >
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.iconLabel}
        onClick={openFileDialog}
        data-testid={testId}
        startIcon={<ImportIcon />}
      >
        Import
      </Button.BaseBtn>
    </StyledTooltip>
  );
});

ToolbarImportButton.displayName = 'ToolbarImportButton';

export default ToolbarImportButton;
