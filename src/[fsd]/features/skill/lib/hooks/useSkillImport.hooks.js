import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { parseMdFrontmatter } from '@/[fsd]/entities/import-wizard';
import { useSkillImportMutation } from '@/[fsd]/features/skill/api';
import { isSkillZip, readSkillZip } from '@/[fsd]/features/skill/lib/helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { SkillsTabs } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import RouteDefinitions from '@/routes';

const ACCEPT = '.md,.zip,text/markdown,application/zip';

const hasFrontmatter = content =>
  content
    .replace(/^\uFEFF/, '')
    .trimStart()
    .startsWith('---');

const parseCommand = (content, commandName) => {
  const { frontmatter, body } = hasFrontmatter(content)
    ? parseMdFrontmatter(content)
    : { frontmatter: {}, body: content.replace(/\r\n?/g, '\n').trim() };
  const firstText =
    body
      .split('\n')
      .map(line => line.replace(/^#+/, '').trim())
      .find(Boolean) || commandName;
  return {
    frontmatter: {
      ...frontmatter,
      name: commandName,
      description: frontmatter?.description || firstText.slice(0, 2304),
    },
    body,
  };
};

const parsePackage = ({ content, commandName, ...rest }) => ({
  ...(commandName ? parseCommand(content, commandName) : parseMdFrontmatter(content)),
  ...rest,
});

const readSkillFile = async file => {
  const packages = isSkillZip(file.name)
    ? await readSkillZip(file)
    : [{ content: await file.text(), filePaths: [] }];
  return packages.map(parsePackage);
};

const toPendingSkill = ({ frontmatter, body, filePaths }) => ({
  name: frontmatter.name,
  description: frontmatter.description,
  instructions: body || '',
  tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
  filePaths,
  // Imported skills are always created with version 'base', regardless
  // of what version was in the exported file. No need to extract the
  // version from frontmatter.
});

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

      if (!file.name.toLowerCase().endsWith('.md') && !isSkillZip(file.name)) {
        toastError('Only .md or .zip files can be imported.');
        return;
      }

      try {
        const packages = await readSkillFile(file);
        const incomplete = packages.find(
          ({ frontmatter }) => !frontmatter?.name || !frontmatter?.description,
        );
        if (incomplete) {
          toastError(
            `The [${incomplete.source || file.name}] is missing required metadata: frontmatter must contain "name" and "description".`,
          );
          return;
        }
        setPending({ file, skills: packages.map(toPendingSkill) });
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
        if (result?.skills) {
          const pluginUnusedKeys = [
            ...new Set(result.skills.flatMap(skill => skill.unused_frontmatter_keys || [])),
          ];
          const imported = `${result.skills.length} ${result.skills.length === 1 ? 'skill' : 'skills'} imported`;
          if (pluginUnusedKeys.length) {
            toastInfo(`${imported}. Kept but not used by ELITEA: ${pluginUnusedKeys.join(', ')}.`);
          } else {
            toastSuccess(`${imported} successfully.`);
          }
          setPending(null);
          return;
        }
        const unusedKeys = result?.unused_frontmatter_keys || [];
        if (result?.notice) {
          toastInfo(result.notice);
        } else if (unusedKeys.length) {
          toastInfo(`Skill imported. Kept but not used by ELITEA: ${unusedKeys.join(', ')}.`);
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
    pendingSkills: pending?.skills || [],
    pendingFileName: pending?.file?.name || '',
    confirmImport,
    cancelImport,
  };
};
