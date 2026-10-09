// eslint-disable-next-line no-control-regex
const UNSAFE_FILE_NAME_CHARS = /[\\/:*?"<>|\x00-\x1f\x7f]/g;

const pad = value => String(value).padStart(2, '0');

export const sanitizeExportFileName = (name, fallback = 'chat') => {
  const cleaned = (name || '').replace(UNSAFE_FILE_NAME_CHARS, '_').replace(/^[\s.]+|[\s.]+$/g, '');
  return cleaned || fallback;
};

export const getConversationExportPath = (projectId, conversationId) =>
  `/elitea_core/conversation_export/prompt_lib/${projectId}/${conversationId}`;

export const buildExportFileName =(name, date = new Date()) => {
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  return `${sanitizeExportFileName(name)}_${datePart}_${timePart}`;
};
