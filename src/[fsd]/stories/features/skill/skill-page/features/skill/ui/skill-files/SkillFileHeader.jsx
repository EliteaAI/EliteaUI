import { memo, useCallback } from 'react';

import { useTheme } from '@mui/material';

import { SKILL_FILE_ACTIONS } from '@/[fsd]/features/skill/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CopyLinkIcon from '@/assets/copy-link-icon.svg?react';
import FileIcon from '@/assets/file.svg?react';

import SkillPaneHeader from './SkillPaneHeader';
import SkillTestButton from './SkillTestButton';

/**
 * The header of the open file in Files: its name, Instructions and Test (each hides while its panel is open)
 * and Copy link.
 */
const SkillFileHeader = memo(props => {
  const { file, isInstructionsOpen, isTestPanelOpen, onOpenInstructions, onOpenTest, onAction } = props;
  const theme = useTheme();

  const handleCopyLink = useCallback(
    () => onAction?.(SKILL_FILE_ACTIONS.copyPath, file.path),
    [file?.path, onAction],
  );

  return (
    <SkillPaneHeader
      title={file?.path.slice(file.path.lastIndexOf('/') + 1) ?? ''}
      testId="skill-file-header"
    >
      {file && !isInstructionsOpen && (
        <Button.IconLabelButton
          label="Instructions"
          icon={<FileIcon />}
          onClick={onOpenInstructions}
          ariaLabel="Open the instructions beside the file"
          testId="skill-open-instructions"
        />
      )}
      {file && !isTestPanelOpen && <SkillTestButton onClick={onOpenTest} />}
      {file && (
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          startIcon={<CopyLinkIcon fill={theme.palette.icon.default} />}
          onClick={handleCopyLink}
          aria-label="Copy the file path to paste into the instructions"
          title="Copy path"
          data-testid="skill-file-copy-link"
        />
      )}
    </SkillPaneHeader>
  );
});

SkillFileHeader.displayName = 'SkillFileHeader';

export default SkillFileHeader;
