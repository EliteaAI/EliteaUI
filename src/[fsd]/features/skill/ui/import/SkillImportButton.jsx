import { memo } from 'react';

import { useSelector } from 'react-redux';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useSkillImport } from '@/[fsd]/features/skill/lib/hooks';
import SkillImportModal from '@/[fsd]/features/skill/ui/import/SkillImportModal';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ImportIcon from '@/assets/import-icon.svg?react';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

const SkillImportButton = memo(() => {
  const styles = skillImportButtonStyles();

  const { projects } = useSelector(state => state.settings);

  const {
    openFileDialog,
    isImporting,
    isModalOpen,
    pendingSkill,
    pendingFileName,
    confirmImport,
    cancelImport,
  } = useSkillImport();

  if (!projects?.filter(({ id }) => id != PUBLIC_PROJECT_ID).length) return null;

  return (
    <>
      <StyledTooltip
        title="Import"
        placement="top"
      >
        <BaseBtn
          data-testid="skills-import-button"
          variant={BUTTON_VARIANTS.icon}
          onClick={openFileDialog}
          disabled={isImporting}
          sx={styles.importBtn}
        >
          <ImportIcon />
        </BaseBtn>
      </StyledTooltip>
      <SkillImportModal
        open={isModalOpen}
        skill={pendingSkill}
        fileName={pendingFileName}
        isImporting={isImporting}
        onClose={cancelImport}
        onConfirm={confirmImport}
      />
    </>
  );
});

SkillImportButton.displayName = 'SkillImportButton';

/** @type {MuiSx} */
const skillImportButtonStyles = () => ({
  importBtn: {
    ml: 1,
    width: '1.75rem',
    height: '1.75rem',
  },
});

export default SkillImportButton;
