import { useCallback, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants';
import { clearBaseUrlPrefix } from '@/common/utils';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB in bytes

export const useUploadWithProgress = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadSmallFile = useCallback(({ file, projectId, conversationId, onProgress }) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append('file', file);
      formData.append('overwrite_attachments', 1);

      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded, event.total);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response[0]);
          } catch {
            resolve(null);
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      const apiSlicePath = '/elitea_core';
      const url = `${clearBaseUrlPrefix(VITE_SERVER_URL)}${apiSlicePath}/attachments/prompt_lib/${projectId}/${conversationId}`;

      xhr.open('POST', url);

      if (DEV) {
        if (VITE_DEV_TOKEN) xhr.setRequestHeader('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
      }

      xhr.send(formData);
    });
  }, []);

  const createFileChunks = useCallback(file => {
    const chunks = [];
    let start = 0;

    while (start < file.size) {
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunks.push(file.slice(start, end));
      start = end;
    }

    return chunks;
  }, []);

  const uploadChunk = useCallback(
    async ({
      chunk,
      chunkIndex,
      totalChunks,
      fileId,
      originalFilename,
      projectId,
      conversationId,
      onProgress,
    }) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append('file', chunk);
        formData.append('chunk_index', chunkIndex);
        formData.append('total_chunks', totalChunks);
        formData.append('file_id', fileId);
        formData.append('file_name', originalFilename);
        formData.append('overwrite_attachments', 1);

        // Track upload progress for this chunk
        xhr.upload.addEventListener('progress', event => {
          if (event.lengthComputable && onProgress) {
            onProgress(event.loaded, event.total);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response[0] ?? { in_progress: true });
            } catch {
              resolve({ sucess: true });
            }
          } else {
            reject(new Error(`Chunk upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Chunk upload failed due to network error'));
        });

        const apiSlicePath = '/elitea_core';
        const url = `${clearBaseUrlPrefix(VITE_SERVER_URL)}${apiSlicePath}/attachments/prompt_lib/${projectId}/${conversationId}`;

        xhr.open('POST', url);

        if (DEV) {
          if (VITE_DEV_TOKEN) xhr.setRequestHeader('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
          xhr.setRequestHeader('Cache-Control', 'no-cache');
        }

        xhr.send(formData);
      });
    },
    [],
  );

  const uploadWithProgress = useCallback(
    async ({ projectId, conversationId, attachments }) => {
      if (!attachments?.length) return { data: [] };

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const results = [];

        const totalBytes = attachments.reduce((sum, file) => sum + file.size, 0);
        let uploadedBytes = 0;

        for (const file of attachments) {
          if (file.size > MAX_FILE_SIZE)
            throw new Error(`File "${file.name}" exceeds maximum size limit of 300MB`);

          if (file.size <= CHUNK_SIZE) {
            const result = await uploadSmallFile({
              file,
              projectId,
              conversationId,
              onProgress: loaded => {
                const totalUploadedBytes = uploadedBytes + loaded;
                const overallProgress = Math.round((totalUploadedBytes / totalBytes) * 100);
                setUploadProgress(Math.min(overallProgress, 100));
              },
            });

            if (result) results.push(result);

            uploadedBytes += file.size;
            continue;
          }

          const chunks = createFileChunks(file);
          const fileId = uuidv4();
          const totalChunks = chunks.length;

          let fileUploadedBytes = 0;
          let groupedChunksFile = null;

          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const res = await uploadChunk({
              chunk: chunks[chunkIndex],
              chunkIndex,
              totalChunks,
              fileId,
              originalFilename: file.name,
              projectId,
              conversationId,
              onProgress: loaded => {
                const currentFileBytes = fileUploadedBytes + loaded;
                const totalUploadedBytes = uploadedBytes + currentFileBytes;
                const overallProgress = Math.round((totalUploadedBytes / totalBytes) * 100);
                setUploadProgress(Math.min(overallProgress, 100));
              },
            });

            fileUploadedBytes += chunks[chunkIndex].size;

            if (!res.in_progress) groupedChunksFile = res;
          }

          uploadedBytes += file.size;

          results.push(groupedChunksFile);
        }

        setIsUploading(false);
        setUploadProgress(100);

        setTimeout(() => setUploadProgress(0), 500);

        return { data: results };
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);
        throw error;
      }
    },
    [createFileChunks, uploadChunk, uploadSmallFile],
  );

  const resetProgress = useCallback(() => {
    setUploadProgress(0);
    setIsUploading(false);
  }, []);

  return {
    uploadWithProgress,
    uploadProgress,
    isUploading,
    resetProgress,
    chunkSize: CHUNK_SIZE,
    maxFileSize: MAX_FILE_SIZE,
  };
};
