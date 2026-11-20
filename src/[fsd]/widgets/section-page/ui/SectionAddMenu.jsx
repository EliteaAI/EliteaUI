import { memo, useMemo } from 'react';

import { GenerateAgentModal } from '@/[fsd]/features/agent/ui/generate-agent-modal';
import { GenerateSkillModal } from '@/[fsd]/features/skill/ui/generate-skill-modal';
import SkillImportModal from '@/[fsd]/features/skill/ui/import/SkillImportModal';
import {
  BUILD_WITH_AI_KINDS,
  IMPORT_KINDS,
  SECTION_PAGE_CONFIG,
} from '@/[fsd]/widgets/section-page/lib/constants';
import { useSectionAddActions } from '@/[fsd]/widgets/section-page/lib/hooks';
import SparkleIcon from '@/assets/ai-sparkle-icon.svg?react';
import ImportIcon from '@/assets/import-icon.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';

import AddMenu from './AddMenu';

const SectionAddMenu = memo(props => {
  const { sectionKey } = props;
  const { entityLabel, importKind, buildWithAi, testIdPrefix } = SECTION_PAGE_CONFIG[sectionKey];
  const {
    canCreate,
    canImport,
    canBuildWithAi,
    onNew,
    onImport,
    onBuildWithAi,
    isBuildWithAiOpen,
    onCloseBuildWithAi,
    skillImport,
  } = useSectionAddActions(sectionKey);

  const items = useMemo(
    () =>
      [
        canCreate && {
          key: 'new',
          icon: <PlusIcon />,
          label: `New ${entityLabel}`,
          onSelect: onNew,
          testId: `${testIdPrefix}-add-new`,
        },
        canImport && {
          key: 'import',
          icon: <ImportIcon />,
          label: 'Import from file',
          onSelect: onImport,
          testId: `${testIdPrefix}-import-button`,
        },
        canBuildWithAi && {
          key: 'build-with-ai',
          icon: <SparkleIcon />,
          label: 'Build with AI',
          onSelect: onBuildWithAi,
          testId: `${testIdPrefix}-build-with-ai`,
        },
      ].filter(Boolean),
    [canBuildWithAi, canCreate, canImport, entityLabel, onBuildWithAi, onImport, onNew, testIdPrefix],
  );

  return (
    <>
      <AddMenu
        items={items}
        label={`Add ${entityLabel.toLowerCase()}`}
        testId={`${testIdPrefix}-add-button`}
      />
      {isBuildWithAiOpen && buildWithAi === BUILD_WITH_AI_KINDS.agent && (
        <GenerateAgentModal
          open
          onClose={onCloseBuildWithAi}
        />
      )}
      {isBuildWithAiOpen && buildWithAi === BUILD_WITH_AI_KINDS.skill && (
        <GenerateSkillModal
          open
          onClose={onCloseBuildWithAi}
        />
      )}
      {importKind === IMPORT_KINDS.skill && (
        <SkillImportModal
          open={skillImport.isModalOpen}
          skill={skillImport.pendingSkill}
          fileName={skillImport.pendingFileName}
          isImporting={skillImport.isImporting}
          onClose={skillImport.cancelImport}
          onConfirm={skillImport.confirmImport}
        />
      )}
    </>
  );
});

SectionAddMenu.displayName = 'SectionAddMenu';

export default SectionAddMenu;
