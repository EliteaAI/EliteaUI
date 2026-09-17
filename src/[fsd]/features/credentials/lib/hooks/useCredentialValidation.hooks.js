import { useCallback, useRef, useState } from 'react';

import {
  useBatchTestConfigurationConnectionMutation,
  useTestConfigurationConnectionMutation,
} from '@/api/configurations';

const AUTHORIZATION_REQUIRED_STATUS = 'authorization_required';

const requiresAuthorization = result =>
  result?.requires_authorization === true ||
  result?.data?.requires_authorization === true ||
  result?.error?.data?.requires_authorization === true;

/**
 * On-demand credential validation with per-credential status caching.
 * Status values: 'idle' | 'checking' | 'valid' | 'invalid' | 'unsupported' | 'authorization_required'
 */
export const useCredentialValidation = () => {
  const [statuses, setStatuses] = useState({});
  const [messages, setMessages] = useState({});
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;

  const [testConnection] = useTestConfigurationConnectionMutation();
  const [batchTestConnection] = useBatchTestConfigurationConnectionMutation();

  const validateCredential = useCallback(
    async ({ projectId, credential }) => {
      const key = credential.originalId || credential.id || credential.uuid;
      if (!key || !projectId || !credential.type) return;

      const currentStatus = statusesRef.current[key];
      if (
        currentStatus === 'checking' ||
        currentStatus === 'valid' ||
        currentStatus === 'invalid' ||
        currentStatus === 'unsupported' ||
        currentStatus === AUTHORIZATION_REQUIRED_STATUS
      )
        return;

      setStatuses(prev => ({ ...prev, [key]: 'checking' }));
      try {
        const result = await testConnection({
          projectId,
          configType: credential.type,
          body: credential.data || credential.settings || {},
        });
        if (requiresAuthorization(result)) {
          setStatuses(prev => ({ ...prev, [key]: AUTHORIZATION_REQUIRED_STATUS }));
          setMessages(prev => {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          });
          return;
        }
        const status = result.error?.status;
        if (status === 404 || status === 405 || status === 501) {
          setStatuses(prev => ({ ...prev, [key]: 'unsupported' }));
          return;
        }
        const isValid = !result.error && !result.data?.error;
        setStatuses(prev => ({ ...prev, [key]: isValid ? 'valid' : 'invalid' }));
        if (!isValid) {
          const msg = result.data?.error || result.error?.data?.message || '';
          if (msg) setMessages(prev => ({ ...prev, [key]: msg }));
        }
      } catch {
        setStatuses(prev => ({ ...prev, [key]: 'invalid' }));
      }
    },
    [testConnection],
  );

  const validateProjectBatch = useCallback(
    async (projectId, creds) => {
      const items = creds.map(credential => ({
        id: String(credential.originalId || credential.id || credential.uuid),
        type: credential.type,
        data: credential.data || credential.settings || {},
      }));

      try {
        const result = await batchTestConnection({ projectId: Number(projectId), items });
        const updates = {};

        if (result.data) {
          const msgUpdates = {};
          result.data.forEach(item => {
            if (item.unsupported) {
              updates[item.id] = 'unsupported';
            } else if (requiresAuthorization(item)) {
              updates[item.id] = AUTHORIZATION_REQUIRED_STATUS;
            } else {
              updates[item.id] = item.success ? 'valid' : 'invalid';
              if (!item.success && item.message) {
                msgUpdates[item.id] = item.message;
              }
            }
          });
          if (Object.keys(msgUpdates).length > 0) {
            setMessages(prev => ({ ...prev, ...msgUpdates }));
          }
        } else {
          creds.forEach(credential => {
            const key = String(credential.originalId || credential.id || credential.uuid);
            updates[key] = 'invalid';
          });
        }

        setStatuses(prev => ({ ...prev, ...updates }));
      } catch {
        const updates = {};
        creds.forEach(credential => {
          const key = String(credential.originalId || credential.id || credential.uuid);
          updates[key] = 'invalid';
        });
        setStatuses(prev => ({ ...prev, ...updates }));
      }
    },
    [batchTestConnection],
  );

  /**
   * Validate multiple credentials in a single batch request per project.
   * Credentials already in a non-idle status are skipped.
   *
   * @param {Array<{ projectId: number|string, credential: object }>} credentials
   */
  const batchValidateCredentials = useCallback(
    async credentials => {
      const toValidate = credentials.filter(({ projectId, credential }) => {
        const key = credential.originalId || credential.id || credential.uuid;
        if (!key || !projectId || !credential.type) return false;
        const currentStatus = statusesRef.current[key];
        return !currentStatus || currentStatus === 'idle';
      });

      if (toValidate.length === 0) return;

      const checkingUpdates = {};
      const byProject = {};
      toValidate.forEach(({ projectId, credential }) => {
        const key = String(credential.originalId || credential.id || credential.uuid);
        checkingUpdates[key] = 'checking';
        statusesRef.current[key] = 'checking';
        const pid = String(projectId);
        if (!byProject[pid]) byProject[pid] = [];
        byProject[pid].push(credential);
      });
      setStatuses(prev => ({ ...prev, ...checkingUpdates }));

      await Promise.all(
        Object.entries(byProject).map(([projectId, creds]) => validateProjectBatch(projectId, creds)),
      );
    },
    [validateProjectBatch],
  );

  const getCredentialStatus = useCallback(credentialId => statuses[credentialId] ?? 'idle', [statuses]);

  const getCredentialMessage = useCallback(credentialId => messages[credentialId] ?? '', [messages]);

  const resetStatus = useCallback(credentialId => {
    delete statusesRef.current[credentialId];
    setStatuses(prev => {
      const next = { ...prev };
      delete next[credentialId];
      return next;
    });
    setMessages(prev => {
      const next = { ...prev };
      delete next[credentialId];
      return next;
    });
  }, []);

  const resetStatuses = useCallback(() => {
    setStatuses({});
    setMessages({});
  }, []);

  return {
    validateCredential,
    batchValidateCredentials,
    getCredentialStatus,
    getCredentialMessage,
    resetStatus,
    resetStatuses,
  };
};
