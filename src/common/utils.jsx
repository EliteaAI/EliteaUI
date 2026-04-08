import { Typography } from '@mui/material';

import { filterProps } from '@/ComponentsLib/utils/common';
import store from '@/[fsd]/app/store';
import { isApplicationCard, isMCPCard, isPipelineCard, isToolkitCard } from '@/common/checkCardType';
import {
  ChatParticipantType,
  CollectionStatus,
  DEV,
  PROMPT_PAYLOAD_KEY,
  TIME_FORMAT,
  VITE_DEV_TOKEN,
  VITE_SERVER_URL,
} from '@/common/constants.js';
import RouteDefinitions, { getBasename } from '@/routes.js';
import { copyToClipboard as browserCopyToClipboard } from '@/utils/browserUtils.js';

export { filterProps };

export const clearBaseUrlPrefix = (url, suffix) => {
  let result = url;
  if (suffix) {
    result = url.endsWith('/') ? url.replace(`${suffix}/`, '') : url.replace(suffix, '');
  }

  result = result.replace(/\/+$/, '');
  return result;
};

export function replaceSubstringAtPosition(str, start, length, replacement) {
  const before = str.substring(0, start);
  const after = str.substring(start + length);
  return before + replacement + after;
}

export const renderStatusComponent = ({ isLoading, isSuccess, isError, successContent }) => {
  if (isLoading) {
    return <Typography variant={'body2'}>...</Typography>;
  }

  if (isError) {
    return <Typography variant={'body2'}>Failed to load.</Typography>;
  }

  if (isSuccess) {
    return <div>{successContent}</div>;
  }

  return null;
};

export const getFileFormat = fileName => {
  const extension = fileName.split('.').pop().toLowerCase();

  if (extension === 'yaml' || extension === 'yml') {
    return 'yaml';
  }
  return extension;
};

export const contextResolver = (context = '') => {
  const variables = context.match(/{{\s*[a-zA-Z_][a-zA-Z0-9_]*\s*}}/g);
  if (!variables) return [];
  const extractedVariables = extractPlaceholders(variables);
  return extractedVariables.sort();
};

export const extractPlaceholders = (variablesWithPlaceholder = []) => {
  const placeholders = variablesWithPlaceholder.map(str =>
    str.replace(/{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/, '$1'),
  );
  return Array.from(new Set(placeholders));
};

export const listMapper = (list = [], payloadkey = '') => {
  const map = {};

  if (payloadkey === PROMPT_PAYLOAD_KEY.variables) {
    list.forEach(item => {
      map[item.key] = { value: item.value, id: item.id };
    });
  }

  return map;
};

export const getInitials = name => {
  if (typeof name !== 'string') {
    throw new TypeError('Name must be a string');
  }

  const names = name.split(' ');

  let firstName = names[0];
  let lastName = names[names.length - 1];
  if (names.length === 1) {
    firstName = name;
    lastName = '';
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return initials;
};

export const stringToColor = string => {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};

export const debounce = (fn, delay) => {
  let timer = null;

  return function () {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, arguments);
      timer = null;
    }, delay);
  };
};

export const isNotFoundError = err => err?.status === 404 || err?.status === 400;

export const buildErrorMessage = err => {
  if (err?.originalStatus === 404) {
    return 'The requested resource was not found!';
  }
  if (err?.status === 403) {
    const state = store.getState();
    const { personal_project_id } = state.user || {};
    const { project } = state.settings || {};
    const actualProjectName = project?.name || (personal_project_id ? 'Private' : null);
    const projectText = actualProjectName ? `${actualProjectName} project` : 'this project';
    return `Insufficient permissions to perform this action\non ${projectText}.`;
  }
  if (err?.data?.message) {
    return err?.data?.message;
  }
  if (err?.data?.error) {
    if (typeof err?.data?.error === 'string') {
      return err?.data?.error;
    } else if (Array.isArray(err?.data?.error)) {
      return err?.data?.error[0]?.msg || 'Unknown error occurred';
    }
    return err?.data?.error;
  }
  if (err?.data?.errors) {
    return Object.values(err?.data?.errors).join('\n');
  }
  if (Array.isArray(err?.data) && err.data.length > 0) {
    const messages = err.data
      .filter(item => !isNullOrUndefined(item?.msg))
      .map(item => {
        return item.loc ? `${item.msg} at ${item.loc.join(', ')}` : item.msg;
      });

    if (messages.length > 0) {
      return messages.join(',\n');
    }
  }
  return typeof err === 'string' ? err : err?.data;
};

export const getStatusColor = (status, theme) => {
  switch (status) {
    case CollectionStatus.Draft:
      return theme.palette.status.draft;
    case CollectionStatus.OnModeration:
      return theme.palette.status.onModeration;
    case CollectionStatus.Published:
      return theme.palette.status.published;
    case CollectionStatus.Rejected:
      return theme.palette.status.rejected;
    default:
      return theme.palette.status.userApproval;
  }
};

const convertToDDMMYYYY = dateString => {
  if (!dateString) {
    return '';
  }
  const dateObj = new Date(dateString);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString();
  return `${day}.${month}.${year}`;
};

const convertToMMMDD = dateString => {
  if (!dateString) {
    return '';
  }
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateObj = new Date(dateString);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = monthNames[dateObj.getMonth()];
  return `${month}, ${day}`;
};

export const timeFormatter = (timeStamp = '', format) => {
  switch (format) {
    case TIME_FORMAT.DDMMYYYY:
      return convertToDDMMYYYY(timeStamp);
    case TIME_FORMAT.MMMDD:
      return convertToMMMDD(timeStamp);
    default:
      return 'unknow date';
  }
};

export const deduplicateVersionByAuthor = (versions = []) => {
  if (Array.isArray(versions)) {
    return Array.from(
      new Set(
        versions.map(
          version =>
            `${version?.author?.name || ''}|${version?.author?.avatar || ''}|${version?.author?.id || ''}`,
        ),
      ),
    );
  }
  return [];
};

export const downloadJSONFile = (data, filename = '') => {
  const blobData = new Blob(
    [typeof data?.data === 'string' ? data?.data : JSON.stringify(data?.data || {})],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.json';
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadCSVFile = (data, filename = '') => {
  const blobData = new Blob([data], { type: 'text/csv' });
  const url = URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.csv';
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Download a blob response from the API (for MD/ZIP exports)
 * @param {Blob} blob - The blob data
 * @param {string} filename - The filename to save as
 */
export const downloadBlobFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  // Safari requires the link to be in the DOM
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Clean up after a short delay to ensure download starts
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Download MD file from text content
 * @param {string} content - The markdown content
 * @param {string} filename - The filename (without extension)
 */
export const downloadMDFile = (content, filename = '') => {
  const blobData = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.md') ? filename : filename + '.md';
  // Safari requires the link to be in the DOM
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Clean up after a short delay to ensure download starts
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

export const downloadBinaryExcelFile = (data, filename = 'file') => {
  const blobData = new Blob([data.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.xlsx';
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadFile = ({ url, filename, handleError = () => {} }) => {
  if (!url) return;

  const headersObj = {
    'Content-Type': 'application/octet-stream',
    ...(DEV && { Authorization: `Bearer ${VITE_DEV_TOKEN}` }),
  };
  const headers = new Headers(headersObj);

  fetch(url, {
    method: 'GET',
    headers,
  })
    .then(response => response.blob())
    .then(blob => {
      // Create a new URL for the blob object
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to download the blob
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filename || 'file';

      // Append the anchor to the body, click it, and then remove it
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Revoke the blob URL after the download
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(error => handleError(error));
};

/**
 * Parse filepath into bucket and filename
 * @param {string} filepath - Path in format /{bucket}/{filename}
 * @returns {{bucket: string, filename: string}}
 */
export const parseFilepath = filepath => {
  if (!filepath || !filepath.startsWith('/')) {
    throw new Error(`Invalid filepath format: ${filepath}`);
  }
  const parts = filepath.substring(1).split('/'); // Remove leading slash and split
  if (parts.length < 2) {
    throw new Error(`Invalid filepath format: ${filepath}`);
  }
  // Bucket is first part, filename is everything after (may contain slashes for nested folders)
  const bucket = parts[0];
  const filename = parts.slice(1).join('/');
  return { bucket, filename };
};

/**
 * Fetches an artifact file and returns a blob object URL, or null on failure.
 * Handles auth headers the same way as downloadFile.
 * Caller is responsible for calling URL.revokeObjectURL() on the result.
 */
export const fetchArtifactBlobUrl = async ({ projectId, filepath, handleError = () => {} }) => {
  try {
    const { bucket, filename } = parseFilepath(filepath);
    const url = `${clearBaseUrlPrefix(VITE_SERVER_URL)}/artifacts/artifact/default/${projectId}/${encodeURIComponent(bucket)}/${encodeURIComponent(filename)}`;
    const headers = new Headers({
      ...(DEV && { Authorization: `Bearer ${VITE_DEV_TOKEN}` }),
    });
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type');
    if (!contentType || contentType.startsWith('text/html')) {
      // Auth redirect returned an HTML login page
      throw new Error('Unexpected response type');
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const downloadFileFromArtifact = ({
  projectId,
  bucket,
  filename,
  filepath,
  handleError = () => {},
}) => {
  // Support both old (bucket+filename) and new (filepath) parameters
  let actualBucket = bucket;
  let actualFilename = filename;

  if (filepath) {
    try {
      const parsed = parseFilepath(filepath);
      actualBucket = parsed.bucket;
      actualFilename = parsed.filename;
    } catch (error) {
      handleError(error);
      return;
    }
  }

  if (!actualBucket || !actualFilename) {
    handleError(new Error('Missing bucket or filename'));
    return;
  }

  const url = `${clearBaseUrlPrefix(VITE_SERVER_URL)}/artifacts/artifact/default/${projectId}/${encodeURIComponent(actualBucket)}/${encodeURIComponent(actualFilename)}`;

  const baseFilename = actualFilename.split('/').pop();

  downloadFile({
    url,
    filename: baseFilename,
    handleError,
  });
};

export const downloadArtifactsAsZip = async ({
  projectId,
  bucket,
  filenames = [],
  bucketContents = [],
  currentPrefix = '',
  handleError = () => {},
  onProgress = () => {},
  onCancel = () => {},
  abortSignal,
}) => {
  try {
    // Dynamically import JSZip to reduce initial bundle size
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const headersObj = {
      'Content-Type': 'application/octet-stream',
      ...(DEV && { Authorization: `Bearer ${VITE_DEV_TOKEN}` }),
    };
    const headers = new Headers(headersObj);

    // Expand folders to include all files within them
    const expandedFilenames = [];
    const folders = [];

    // First pass: separate files and folders
    for (const filename of filenames) {
      if (filename.endsWith('/')) {
        folders.push(filename);
      } else {
        expandedFilenames.push(filename);
      }
    }
    // Second pass: if there are folders, filter files from bucket contents
    if (folders.length > 0 && bucketContents.length > 0) {
      // For each folder, add all files that start with the folder path
      for (const folder of folders) {
        const folderFiles = bucketContents.filter(
          item => item.key && item.key.startsWith(folder) && !item.key.endsWith('/'),
        );
        expandedFilenames.push(...folderFiles.map(f => f.key));
      }
    }

    const totalFiles = expandedFilenames.length;

    // If no files to download (e.g., folders selected but bucketContents empty),
    // cancel the operation so the UI does not report a successful download
    if (totalFiles === 0) {
      onCancel();
      return;
    }

    // Download each file and add to ZIP
    for (let i = 0; i < expandedFilenames.length; i += 1) {
      if (abortSignal?.aborted) {
        onCancel();
        return;
      }

      const filename = expandedFilenames[i];
      const url = `${clearBaseUrlPrefix(VITE_SERVER_URL)}/artifacts/artifact/default/${projectId}/${encodeURIComponent(bucket)}/${encodeURIComponent(filename)}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: abortSignal,
        });

        if (!response.ok) {
          throw new Error(`Failed to download ${filename}: ${response.statusText}`);
        }

        const blob = await response.blob();
        // Strip the currentPrefix from the filename for the zip structure
        let zipPath = filename;
        if (currentPrefix) {
          const normalizedPrefix = currentPrefix.endsWith('/') ? currentPrefix : `${currentPrefix}/`;
          if (filename.startsWith(normalizedPrefix)) {
            zipPath = filename.substring(normalizedPrefix.length);
          }
        }
        zip.file(zipPath, blob);

        onProgress({
          current: i + 1,
          total: totalFiles,
          filename,
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          onCancel();
          return;
        }
        throw new Error(`Error downloading file ${filename}: ${error.message}`);
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Download ZIP
    const zipUrl = window.URL.createObjectURL(zipBlob);
    const anchor = document.createElement('a');
    anchor.href = zipUrl;
    anchor.download = `${bucket || 'artifacts'}.zip`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.URL.revokeObjectURL(zipUrl);
  } catch (error) {
    handleError(error);
  }
};

export const filterByElements = (collection = [], elements = []) => {
  const filteredCollection = collection.filter(i => {
    const { tags } = i;
    return tags.some(tag => {
      const { name } = tag;
      return elements.includes(name);
    });
  });

  return filteredCollection.length ? filteredCollection : collection;
};

function descendingComparator(a, b, orderBy) {
  if (typeof b[orderBy] === 'string') {
    return b[orderBy].toLocaleLowerCase().localeCompare(a[orderBy].toLocaleLowerCase());
  }
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
export function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

/**
 * Comparator function that prioritizes pinned items
 * Pinned items (is_pinned: true) will always come before unpinned items
 */
export function pinnedComparator(a, b) {
  if (a.is_pinned && !b.is_pinned) return -1;
  if (!a.is_pinned && b.is_pinned) return 1;
  return 0;
}

/**
 * Creates a combined comparator that first sorts by pinned status,
 * then applies a secondary comparator for items with the same pinned status
 */
export function getPinnedComparator(secondaryComparator) {
  return (a, b) => {
    // First, sort by pinned status
    const pinnedOrder = pinnedComparator(a, b);
    if (pinnedOrder !== 0) return pinnedOrder;

    // If both have same pinned status, apply secondary sort
    return secondaryComparator ? secondaryComparator(a, b) : 0;
  };
}

export function escapeString(string) {
  const symbolsRegExp = /[.*+\-?^${}()|[\]\\]/g;
  return string.replace(symbolsRegExp, '\\$&');
}

export function splitStringByKeyword(string, keyword) {
  const resultArray = [];
  if (keyword) {
    const regexp = new RegExp(`(${escapeString(keyword)})`, 'gi');
    const splittedStrings = string ? string.split(regexp) : [];
    for (let index = 0; index < splittedStrings.length; index++) {
      const element = splittedStrings[index];
      resultArray.push({
        text: element,
        highlight: regexp.test(element),
      });
    }
  } else {
    resultArray.push({
      text: string,
      highlight: false,
    });
  }

  return resultArray;
}

export const removeDuplicateObjects = (objects = []) => {
  const uniqueData = [];
  const idsSet = new Set();

  objects.forEach(item => {
    if (!idsSet.has(item.id)) {
      idsSet.add(item.id);
      uniqueData.push(item);
    }
  });

  return uniqueData;
};

export const sortByCreatedAt = (a, b) => {
  if (a.created_at < b.created_at) {
    return 1;
  } else if (a.created_at > b.created_at) {
    return -1;
  } else {
    return 0;
  }
};

export const sortByName = (a, b) => {
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
};

const DAY_IN_MILLISECONDS = 24 * 3600 * 1000;

export const calculateExpiryInDays = expiration => {
  if (expiration !== null) {
    const currentTime = new Date().getTime();
    const expiryTime = new Date(expiration).getTime();
    const duration = expiryTime - currentTime;
    if (duration > DAY_IN_MILLISECONDS) {
      return Math.round(duration / DAY_IN_MILLISECONDS);
    } else if (duration > 0) {
      return 1;
    }
    return 0;
  } else {
    return -1;
  }
};

const copyToClipboard = text => {
  const textField = document.createElement('textarea');
  textField.innerText = text;
  document.body.appendChild(textField);
  textField.select();
  document.execCommand('copy');
  textField.remove();
};

export const handleCopy = async text => {
  try {
    await browserCopyToClipboard(text);
  } catch {
    // Fallback to old method if new one fails
    navigator ? navigator.clipboard.writeText(text) : copyToClipboard(text);
  }
};

export function capitalizeFirstChar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function handleDeploymentName(name) {
  return name
    .split('_')
    .filter(word => !!word)
    .map(word => {
      if (word.toLowerCase() === 'ai') {
        return 'AI';
      } else if (word.toLowerCase() === 'integration') {
        return '';
      } else {
        return capitalizeFirstChar(word);
      }
    })
    .join(' ');
}

export const accessObjectProperty = (object, path) => {
  return path.split('.').reduce((o, i) => o[i], object);
};

export const stringToList = (valueString, delimiter = ',') => {
  if (valueString && typeof valueString === 'string') {
    return valueString
      .split(delimiter)
      .filter(item => !!item.length)
      .map(item => item.trim());
  } else if (Array.isArray(valueString)) {
    return Array.isArray;
  }
  return [];
};

export function deepCloneObject(obj) {
  // null, 0, false
  if (!obj) {
    return obj;
  }
  // Array
  if (Array.isArray(obj)) {
    return obj.map(val => deepCloneObject(val));
  }
  // Object
  if (typeof obj === 'object') {
    const result = {};
    Object.keys(obj).forEach(key => {
      result[key] = deepCloneObject(obj[key]);
    });
    return result;
  }
  // Anything else
  return obj;
}

export const updateObjectByPath = (object, path, value, replace) => {
  const pathParts = path.split('.');
  const theNewObject = deepCloneObject(object);
  let obj = theNewObject;
  pathParts.forEach((part, index) => {
    if (obj[part] !== undefined) {
      if (index < pathParts.length - 1) {
        obj = obj[part];
      } else {
        // Check if both current value and new value are objects (excluding null and arrays)
        const isCurrentValueObject =
          obj[part] !== null && typeof obj[part] === 'object' && !Array.isArray(obj[part]);
        const isNewValueObject = value !== null && typeof value === 'object' && !Array.isArray(value);

        if (isCurrentValueObject && isNewValueObject && !replace) {
          obj[part] = {
            ...obj[part],
            ...value,
          };
        } else if (Array.isArray(value)) {
          obj[part] = [...value];
        } else {
          obj[part] = value;
        }
      }
    } else {
      if (index < pathParts.length - 1) {
        obj[part] = {};
        obj = obj[part];
      } else {
        // For new properties, only merge if both are non-null objects
        const isNewValueObject = value !== null && typeof value === 'object' && !Array.isArray(value);
        if (isNewValueObject) {
          obj[part] = {
            ...value,
          };
        } else if (Array.isArray(value)) {
          obj[part] = [...value];
        } else {
          obj[part] = value;
        }
      }
    }
  });

  return theNewObject;
};

export const convertToJson = content => {
  let json = {};
  try {
    json = JSON.parse(content);
  } catch {
    //
  }
  return json;
};

export const convertJsonToString = (content, inBlock = false) => {
  let result = content;
  if (typeof content !== 'string') {
    try {
      result = !inBlock
        ? JSON.stringify(content, null, 2)
        : '```json\n ' + JSON.stringify(content, null, 2) + '\n```';
    } catch {
      result = '' + content;
    }
  }
  return result;
};

export const parseCustomJsonTool = customJsonStr => {
  let parsedFunctions = [];
  const result = convertToJson(customJsonStr);
  if (!Array.isArray(result)) {
    parsedFunctions.push(result);
  } else {
    parsedFunctions = result;
  }
  return parsedFunctions;
};

export function getValueByPath(obj, path) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length; i++) {
    if (current[keys[i]] === undefined) {
      return undefined;
    } else {
      current = current[keys[i]];
    }
  }

  return current;
}

export const uniqueObjectArray = (array, uniqueProp = 'id') => {
  const result = (array || []).filter(
    (obj, i) => array.findIndex(o => o[uniqueProp] === obj[uniqueProp]) === i,
  );
  return result;
};

export const getChatParticipantUniqueId = participant => {
  if (participant) {
    const entity_name =
      participant.entity_name === ChatParticipantType.Applications &&
      participant.entity_settings?.agent_type === ChatParticipantType.Pipelines
        ? ChatParticipantType.Pipelines
        : participant.entity_name;
    return (
      entity_name +
      '_' +
      (participant.entity_name === ChatParticipantType.Models
        ? participant.entity_meta?.model_name + '-' + participant.entity_meta?.integration_uid
        : participant.entity_meta?.id) +
      '_' +
      (participant.entity_meta?.project_id || '')
    );
  }
  return '';
};

export const getRawParticipantUniqueId = participant => {
  if (participant) {
    const participantType =
      participant.agent_type === ChatParticipantType.Pipelines
        ? ChatParticipantType.Pipelines
        : participant.participantType;
    return (
      participantType +
      '_' +
      (participant.participantType === ChatParticipantType.Models
        ? participant.model_name + '-' + participant.integration_uid
        : participant.id) +
      '_' +
      (participant.project_id || '')
    );
  }
  return '';
};

export const isNullOrUndefined = variable => {
  return variable === null || variable === undefined;
};

export const areTheSameConversations = (conversation1, conversation2) => {
  if (conversation1 && conversation2) {
    return conversation1.id === conversation2.id && !!conversation1.isPlayback === !!conversation2.isPlayback;
  }
  return false;
};

export const areTheSameFolders = (folder1, folder2) => {
  if (folder1 && folder2) {
    return folder1.id === folder2.id;
  }
  return false;
};

export const genConversationId = conversation => conversation?.id + '_isPlayback_' + conversation?.isPlayback;
export const genFolderId = folder => 'Folder_' + folder?.id;

export const uniqueArrayByProp = (array, prop) =>
  array
    .map(e => e[prop])
    .map((e, i, final) => final.indexOf(e) === i && i)
    .filter(e => array[e])
    .map(e => array[e]);

export const isEquivalent = (a, b) => {
  if (a === b || (a === null && b === undefined) || (b === null && a === undefined)) {
    return true;
  }

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!keysB.includes(key) || !isEquivalent(a[key], b[key])) {
      return false;
    }
  }

  return true;
};

// Validates that all `requiredKeys` are present in the `inputVariables` array and
// that none of their values are empty.
export const checkRequiredKeys = (inputVariables, requiredKeys) => {
  for (const key of requiredKeys) {
    // eslint-disable-next-line no-prototype-builtins
    if (!inputVariables.hasOwnProperty(key) || !inputVariables[key]) {
      return false;
    }
  }
  return true;
};

export const collectIndexPaths = dataObject => {
  const { importItems } = dataObject;
  const indexPaths = [];

  importItems.forEach((item, importItemsIndex) => {
    if (item.entity === 'datasources' || item.entity === 'toolkits' || !item.versions) {
      indexPaths.push(`${importItemsIndex}`);
    } else {
      item.versions.forEach((_version, versionIndex) => {
        const path = `${importItemsIndex}.${versionIndex}`;
        indexPaths.push(path);
      });
    }
  });

  return indexPaths;
};

export const isUUID = value =>
  value &&
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// Re-export from centralized utility to maintain API compatibility
export { isAttachmentImage as isImageFile } from '@/utils/attachmentImageUtils';

export const buildForkedEntityHref = (entity, meta) => {
  if (
    !['prompts', 'datasources', 'agents', 'pipelines'].includes(entity) ||
    !meta?.parent_project_id ||
    !meta?.parent_entity_id
  ) {
    return '';
  }

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const basename = getBasename();
  const projectEntityPath = `/${meta.parent_project_id}/${entity}/all/${meta.parent_entity_id}${meta.parent_version_id ? `/${meta.parent_version_id}` : ''}`;

  return `${baseUrl}${basename}${projectEntityPath}?viewMode=owner`;
};

export const getEntityTypeByCardType = cardType => {
  if (isApplicationCard(cardType)) return 'agents';
  if (isPipelineCard(cardType)) return 'pipelines';
};

export const getEntityType = type => {
  if (isApplicationCard(type)) {
    return ChatParticipantType.Applications;
  } else if (isPipelineCard(type)) {
    return 'pipeline';
  } else if (isToolkitCard(type)) {
    return 'toolkit';
  } else if (isMCPCard(type)) {
    return 'mcp';
  }
  return ChatParticipantType.Applications;
};

export const replacePathParams = (path, params) => {
  Object.keys(params).forEach(key => {
    path = path.replace(`:${key}`, params[key]);
  });
  return path;
};

export const parseValueToIntNumber = value => {
  const isValidIntNumber = /^(0|[1-9]\d*)$/.test(value);
  return isValidIntNumber ? parseInt(value) : '';
};

export const DEFAULT_ENTITY_TAB = 'all';
export const PROJECT_ID_URL_PREFIX = '/:projectId';

const getProjectPath = ({ entity_project_id, entity_name, entity_id }) => {
  switch (entity_name) {
    case 'application':
    case 'applications':
    case 'agent':
    case 'agents':
      return replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.ApplicationsDetail, {
        projectId: entity_project_id,
        tab: DEFAULT_ENTITY_TAB,
        agentId: entity_id,
      });
    case 'pipeline':
    case 'pipelines':
      return replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.PipelineDetail, {
        projectId: entity_project_id,
        tab: DEFAULT_ENTITY_TAB,
        agentId: entity_id,
      });
    case 'toolkit':
    case 'toolkits':
      return replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.ToolkitDetail, {
        projectId: entity_project_id,
        tab: DEFAULT_ENTITY_TAB,
        toolkitId: entity_id,
      });
    default:
      return '';
  }
};

export const genForkedEntityLink = ({ entity_project_id, entity_name, entity_id, name }) => {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const basename = getBasename();
  const projectPath = getProjectPath({ entity_project_id, entity_name, entity_id });
  return `${baseUrl}${basename}${projectPath}?viewMode=owner&name=${encodeURIComponent(name)}`;
};

export const markAllDuplicatesByMultipleKeys = (array, keys) => {
  const count = array.reduce((acc, item) => {
    const compositeKey = keys
      .map(key => item[key])
      .join('|')
      .toLocaleLowerCase();
    acc[compositeKey] = (acc[compositeKey] || 0) + 1;
    return acc;
  }, {});

  return array.map(item => {
    const compositeKey = keys
      .map(key => item[key])
      .join('|')
      .toLocaleLowerCase();
    return {
      ...item,
      isDuplicate: count[compositeKey] > 1,
    };
  });
};

export const replaceVersionInPath = (newVersionName, pathname, encodedCurrentVersionName, id) => {
  const encodedVersion = encodeURIComponent(newVersionName);
  const pathToReplace = `${id}/${encodedCurrentVersionName}`;
  return encodedCurrentVersionName && pathname.includes(pathToReplace)
    ? pathname.replace(pathToReplace, `${id}/${encodedVersion}`)
    : newVersionName
      ? pathname + '/' + encodedVersion
      : pathname;
};

export const sortByPinned = (items, pinnedIds = [], idKey = 'id') => {
  if (!items || items.length === 0 || pinnedIds.length === 0) {
    return items;
  }

  const pinnedItems = [];
  const unpinnedItems = [];

  items.forEach(item => {
    const itemId = item[idKey];
    if (pinnedIds.includes(itemId)) {
      pinnedItems.push(item);
    } else {
      unpinnedItems.push(item);
    }
  });

  return [...pinnedItems, ...unpinnedItems];
};

export default renderStatusComponent;
