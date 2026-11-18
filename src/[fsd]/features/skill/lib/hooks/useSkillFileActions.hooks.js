import { useCallback, useMemo, useState } from 'react';

import {
  useDeleteSkillVersionFileMutation,
  useLazySkillVersionFileBlobQuery,
  useRenameSkillVersionFileMutation,
  useUploadSkillVersionFileMutation,
} from '@/[fsd]/features/skill/api';
import { fileBaseName, isPathInFolder, pathsOverlap } from '@/[fsd]/features/skill/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage, downloadBlobFile, handleCopy } from '@/common/utils';

const describeFailures = (verb, failures) =>
  `${failures.length} ${failures.length === 1 ? 'file was' : 'files were'} not ${verb}: ${failures
    .map(({ path, error }) => `${path} (${buildErrorMessage(error)})`)
    .join('; ')}`;

/**
 * File actions of one skill version. Each action is stored at once by the backend: Save and Discard of the
 * page do not touch files. Folders are path prefixes, so a folder action runs once per file in it.
 */
export const useSkillFileActions = props => {
  const { projectId, skillId, versionId, files = [], onPathMoved, onPathRemoved } = props;
  const { toastError, toastInfo, toastSuccess } = useToast();
  const scope = useMemo(() => ({ projectId, skillId, versionId }), [projectId, skillId, versionId]);
  const [isBusy, setIsBusy] = useState(false);

  const [uploadFile] = useUploadSkillVersionFileMutation();
  const [renameFile] = useRenameSkillVersionFileMutation();
  const [deleteFile] = useDeleteSkillVersionFileMutation();
  const [fetchBlob] = useLazySkillVersionFileBlobQuery();

  const runEach = useCallback(async (items, request) => {
    setIsBusy(true);
    const failures = [];
    for (const item of items) {
      try {
        await request(item).unwrap();
      } catch (error) {
        failures.push({ path: item.path, error });
      }
    }
    setIsBusy(false);
    return failures;
  }, []);

  const uploadFiles = useCallback(
    async (pickedFiles, targetPath) => {
      const items = pickedFiles.map(file => ({
        file,
        path: targetPath?.file ?? (targetPath?.folder ? `${targetPath.folder}/${file.name}` : file.name),
      }));
      const isTaken = item => !targetPath?.file && files.some(file => pathsOverlap(item.path, file.path));
      const skipped = items.filter(isTaken).map(item => item.path);
      const uploads = items.filter(item => !isTaken(item));
      const failures = await runEach(uploads, ({ file, path }) => uploadFile({ ...scope, path, file }));
      if (skipped.length)
        toastError(
          `A file or folder already uses ${skipped.join(', ')}: rename it first or use Replace with upload`,
        );
      if (failures.length) toastError(describeFailures('uploaded', failures));
      else if (uploads.length)
        toastSuccess(
          uploads.length === 1 ? `${uploads[0].path} uploaded` : `${uploads.length} files uploaded`,
        );
    },
    [files, scope, runEach, toastError, toastSuccess, uploadFile],
  );

  const movePaths = useCallback(
    async moves => {
      const failures = await runEach(moves, ({ path, newPath }) => renameFile({ ...scope, path, newPath }));
      moves
        .filter(move => !failures.some(failure => failure.path === move.path))
        .forEach(move => onPathMoved?.(move.path, move.newPath));
      if (failures.length) toastError(describeFailures('renamed', failures));
    },
    [scope, onPathMoved, renameFile, runEach, toastError],
  );

  const renamePath = useCallback(
    (path, newPath, isFolder) =>
      movePaths(
        isFolder
          ? files
              .filter(file => isPathInFolder(file.path, path))
              .map(file => ({ path: file.path, newPath: `${newPath}${file.path.slice(path.length)}` }))
          : [{ path, newPath }],
      ),
    [files, movePaths],
  );

  const deletePath = useCallback(
    async (path, isFolder) => {
      const paths = isFolder
        ? files.filter(file => isPathInFolder(file.path, path)).map(file => file.path)
        : [path];
      const failures = await runEach(
        paths.map(item => ({ path: item })),
        ({ path: item }) => deleteFile({ ...scope, path: item }),
      );
      paths
        .filter(item => !failures.some(failure => failure.path === item))
        .forEach(item => onPathRemoved?.(item));
      if (failures.length) toastError(describeFailures('deleted', failures));
    },
    [scope, deleteFile, files, onPathRemoved, runEach, toastError],
  );

  const downloadPath = useCallback(
    async path => {
      try {
        const blob = await fetchBlob({ ...scope, path }).unwrap();
        downloadBlobFile(blob, fileBaseName(path));
      } catch (error) {
        toastError(buildErrorMessage(error));
      }
    },
    [scope, fetchBlob, toastError],
  );

  const copyPath = useCallback(
    path => {
      handleCopy(path);
      toastInfo(`Path copied: ${path}`);
    },
    [toastInfo],
  );

  return { isBusy, uploadFiles, renamePath, deletePath, downloadPath, copyPath };
};
