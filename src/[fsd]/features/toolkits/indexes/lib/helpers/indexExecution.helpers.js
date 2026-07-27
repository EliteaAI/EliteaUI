import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';

export const INDEX_EXECUTION_COMPLETED_EVENT = 'index.ingest.completed';
export const INDEX_EXECUTION_FAILED_EVENT = 'execution.failed';
export const INDEX_EXECUTION_NODE_EVENT = 'execution.node_event';

const executionMessage = (prefix, message, fallback) => `${prefix} ${message || fallback}`;

export const parseIndexExecutionEvent = (eventType, data) => {
  if (![INDEX_EXECUTION_COMPLETED_EVENT, INDEX_EXECUTION_FAILED_EVENT].includes(eventType)) return null;

  let payload;
  try {
    payload = JSON.parse(data);
  } catch {
    return {
      state: IndexStatuses.fail,
      content: '❌ Indexing returned an invalid terminal response.',
    };
  }

  if (eventType === INDEX_EXECUTION_FAILED_EVENT) {
    const cancelled = payload?.code === 'CANCELLED';
    return {
      state: cancelled ? IndexStatuses.cancelled : IndexStatuses.fail,
      content: executionMessage(
        cancelled ? '⏹️' : '❌',
        typeof payload?.safe_message === 'string' ? payload.safe_message : '',
        cancelled ? 'Indexing was cancelled.' : 'Indexing failed.',
      ),
    };
  }

  const message = typeof payload?.message === 'string' ? payload.message : '';
  switch (payload?.status) {
    case 'ok':
      return {
        state: IndexStatuses.success,
        content: executionMessage('✅', message, 'Indexing completed successfully.'),
      };
    case 'partly_indexed':
      return {
        state: IndexStatuses.partlyOk,
        content: executionMessage('⚠️', message, 'Indexing completed with partial results.'),
      };
    case 'error':
      return {
        state: IndexStatuses.fail,
        content: executionMessage('❌', message, 'Indexing failed.'),
      };
    default:
      return {
        state: IndexStatuses.fail,
        content: '❌ Indexing returned an invalid terminal status.',
      };
  }
};

export const parseIndexNodeEvent = (data, executionMessageId) => {
  let payload;
  try {
    payload = JSON.parse(data);
  } catch {
    return null;
  }
  if (!payload || payload instanceof Array || typeof payload !== 'object' || typeof payload.type !== 'string')
    return null;

  if (payload.message_id == null)
    return executionMessageId ? { ...payload, message_id: executionMessageId } : payload;
  if (typeof payload.message_id !== 'string' || !payload.message_id) return null;
  if (executionMessageId && payload.message_id !== executionMessageId) return null;

  return payload;
};

export const buildIndexExecutionEventsUrl = (baseUrl, projectId, taskId) => {
  const normalizedBase = String(baseUrl || '').replace(/\/$/, '');
  return `${normalizedBase}/executions/${encodeURIComponent(projectId)}/${encodeURIComponent(taskId)}/events`;
};

export const buildPendingIndexExecutionKey = ({ projectId, toolkitId, indexName }) =>
  `elitea:index-execution:${projectId}:${toolkitId}:${encodeURIComponent(indexName)}`;

export const resolveIndexExecutionState = (metadataState, executionState) => executionState ?? metadataState;

export const resolveIndexExecutionTaskId = (metadataTaskId, admittedTaskId) =>
  admittedTaskId || metadataTaskId;

export const canStartToolkitRun = ({
  indexing,
  isCreateIndexMode,
  isValidForm,
  isRunning,
  isIndexing,
  indexStartPending,
}) =>
  ((indexing && !isCreateIndexMode) || isValidForm) &&
  !isRunning &&
  (!indexing || (!isIndexing && !indexStartPending));

export const isIndexExecutionConflict = error => error?.status === 409;
