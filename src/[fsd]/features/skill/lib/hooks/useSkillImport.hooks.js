import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { parseMdFrontmatter } from '@/[fsd]/entities/import-wizard/lib/helpers';
import { useSkillImportMutation } from '@/[fsd]/features/skill/api';
import { SkillsTabs } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

const ACCEPT = '.md,text/markdown';

export const useSkillImport = () => {
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const [importSkill, { isLoading: isImporting }] = useSkillImportMutation();
  const { toastError, toastSuccess, toastInfo } = useToast();

  const [pending, setPending] = useState(null);

  const goToSkill = useCallback(
    skillId => {
      if (!skillId) return;
      navigate(`${RouteDefinitions.Skills}/${SkillsTabs[0]}/${skillId}`);
    },
    [navigate],
  );

  const stageFile = useCallback(
    async file => {
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.md')) {
        toastError('Only .md files can be imported.');
        return;
      }

      try {
        const content = await file.text();
        const { frontmatter, body } = parseMdFrontmatter(content);
        if (!frontmatter?.name || !frontmatter?.description) {
          toastError(
            `The [${file.name}] is missing required metadata: frontmatter must contain "name" and "description".`,
          );
          return;
        }
        setPending({
          file,
          skill: {
            name: frontmatter.name,
            description: frontmatter.description,
            instructions: body || '',
            tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
            // Imported skills are always created with version 'base', regardless
            // of what version was in the exported file. No need to extract the
            // version from frontmatter.
          },
        });
      } catch (error) {
        toastError(`Not supported file [${file.name}]: ${error.message}`);
      }
    },
    [toastError],
  );

  const handleFileUpload = useCallback(
    async event => {
      const file = event.target.files?.[0];
      // Reset so the same file can be re-selected later.
      event.target.value = '';
      await stageFile(file);
    },
    [stageFile],
  );

  const openFileDialog = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = ACCEPT;
    fileInput.onchange = handleFileUpload;
    fileInput.click();
  }, [handleFileUpload]);

  const cancelImport = useCallback(() => setPending(null), []);

  const confirmImport = useCallback(
    async targetProjectId => {
      if (!pending?.file) return;
      const importProjectId = targetProjectId || projectId;
      try {
        const result = await importSkill({ projectId: importProjectId, file: pending.file }).unwrap();
        if (result?.notice) {
          toastInfo(result.notice);
        } else {
          toastSuccess('Skill imported successfully.');
        }
        setPending(null);
        if (importProjectId === projectId) {
          goToSkill(result?.id);
        }
      } catch (error) {
        toastError(buildErrorMessage(error) || 'Failed to import skill.');
      }
    },
    [pending, importSkill, projectId, toastInfo, toastSuccess, goToSkill, toastError],
  );

  return {
    openFileDialog,
    isImporting,
    isModalOpen: !!pending,
    pendingSkill: pending?.skill || null,
    pendingFileName: pending?.file?.name || '',
    confirmImport,
    cancelImport,
  };
};
