import { useCallback } from 'react';

import JSZip from 'jszip';
import { useDispatch } from 'react-redux';

import { mdToApplicationJson, parseMdFrontmatter } from '@/[fsd]/entities/import-wizard/lib/helpers';
import { actions as importWizardActions } from '@/[fsd]/entities/import-wizard/model/importWizard.slice';
import useToast from '@/hooks/useToast';

export const useImport = () => {
  const dispatch = useDispatch();
  const { toastError } = useToast();

  const parseMdFile = useCallback(
    (content, filename = '') => {
      try {
        const { frontmatter, body } = parseMdFrontmatter(content);
        return mdToApplicationJson(frontmatter, body);
      } catch (error) {
        const fileInfo = filename ? ` The [${filename}]` : '';
        toastError(`Not supported file:${fileInfo}: ${error.message}`);
        return null;
      }
    },
    [toastError],
  );

  const handleMarkdownFile = useCallback(
    file => {
      const reader = new FileReader();

      reader.onload = async e => {
        const contents = e.target.result;
        const requestBody = parseMdFile(contents, file.name);

        if (!requestBody) return null;

        dispatch(
          importWizardActions.openImportWizard({
            isForking: false,
            data: requestBody,
          }),
        );
      };

      reader.readAsText(file);
    },
    [dispatch, parseMdFile],
  );

  const handleZipFile = useCallback(
    async file => {
      // ZIP file - extract and parse all .md files
      try {
        const zip = await JSZip.loadAsync(file);

        const applications = [];
        const toolkits = [];
        const parsePromises = [];

        zip.forEach((relativePath, zipEntry) => {
          if (zipEntry.dir) return;

          const entryName = relativePath.toLowerCase();

          if (entryName.endsWith('.md'))
            parsePromises.push(zipEntry.async('string').then(content => parseMdFile(content, relativePath)));
        });

        const parsedResults = await Promise.all(parsePromises);

        // Merge all parsed results, grouping by application name
        const appsByName = new Map();

        for (const parsed of parsedResults) {
          if (!parsed) continue;

          if (parsed.toolkits) toolkits.push(...parsed.toolkits);
          if (parsed.applications) {
            for (const app of parsed.applications) {
              const appName = app.name;

              if (appsByName.has(appName)) {
                // Merge versions into existing app
                const existingApp = appsByName.get(appName);
                existingApp.versions.push(...app.versions);
              } else {
                // First time seeing this app name
                appsByName.set(appName, { ...app });
              }
            }
          }
        }

        // Convert map to array
        applications.push(...appsByName.values());

        if (applications.length === 0) {
          toastError('No valid .md files found in the ZIP archive.');
          return;
        }

        // Build name → import_uuid map for all agents (for resolving nested agent references)
        const agentNameToUuid = {};
        for (const app of applications) {
          if (app.name && app.import_uuid) {
            agentNameToUuid[app.name] = app.import_uuid;
          }
        }

        // Resolve application-type toolkit references by agent name
        for (const app of applications) {
          const version = app.versions?.[0];
          if (!version?.tools) continue;

          for (const tool of version.tools) {
            // For application-type toolkits, look up the referenced agent by name
            if (tool.type === 'application' && !tool.application_import_uuid) {
              const toolkitName = tool.toolkit_name || tool.name;
              if (toolkitName) {
                const referencedUuid = agentNameToUuid[toolkitName];
                if (referencedUuid) {
                  tool.application_import_uuid = referencedUuid;
                }
              }
            }
          }
        }

        // Create combined import data
        const requestBody = {
          _metadata: { version: 2, format: 'zip' },
          applications,
          toolkits,
        };

        dispatch(
          importWizardActions.openImportWizard({
            isForking: false,
            data: requestBody,
          }),
        );
      } catch (error) {
        // eslint-disable-next-line no-console -- Error logging needed for debugging ZIP import failures
        console.error('ZIP import error:', error);
        toastError(`Failed to process ZIP file: ${error.message}`);
      }
    },
    [dispatch, parseMdFile, toastError],
  );

  const handleFileUpload = useCallback(
    async event => {
      const file = event.target.files[0];

      if (!file) return;

      const filename = file.name.toLowerCase();

      if (filename.endsWith('.md')) handleMarkdownFile(file);
      else if (filename.endsWith('.zip')) await handleZipFile(file);
      else toastError('Unsupported file type. Please use .md or .zip files.');
    },
    [handleMarkdownFile, handleZipFile, toastError],
  );

  const openFileDialog = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.md,.zip,text/markdown,application/zip';

    fileInput.onchange = handleFileUpload;
    fileInput.click();
  }, [handleFileUpload]);

  return { handleFileUpload, openFileDialog };
};
