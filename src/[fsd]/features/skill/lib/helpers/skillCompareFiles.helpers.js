import { MAX_INSTRUCTIONS_LENGTH } from '@/common/constants';

import {
  SKILL_COMPARE_FILE_STATUS,
  SKILL_COMPARE_FILE_STATUS_LABELS,
} from '../constants/skillFiles.constants';
import { BYTE_ORDER_MARK, withoutByteOrderMark } from './skillFiles.helpers';

const FILE_EDIT_PREFIX = 'file:';

export const fileEditKey = path => `${FILE_EDIT_PREFIX}${path}`;

export const pickFileEdits = (edits = {}) =>
  Object.keys(edits)
    .filter(key => key.startsWith(FILE_EDIT_PREFIX))
    .map(key => ({ key, path: key.slice(FILE_EDIT_PREFIX.length), content: edits[key] }));

export const isDiffableTextFile = file => Boolean(file?.isText) && file.size <= MAX_INSTRUCTIONS_LENGTH;

const resolveStatus = (left, right) => {
  if (!left) return SKILL_COMPARE_FILE_STATUS.new;
  if (!right) return SKILL_COMPARE_FILE_STATUS.removed;
  if (left.sha256 === right.sha256) return SKILL_COMPARE_FILE_STATUS.same;
  return left.isText && right.isText ? SKILL_COMPARE_FILE_STATUS.changed : SKILL_COMPARE_FILE_STATUS.replaced;
};

export const buildCompareFileEntries = (leftFiles = [], rightFiles = []) => {
  const rightByPath = new Map(rightFiles.map(file => [file.path, file]));
  const leftPaths = new Set(leftFiles.map(file => file.path));
  return [
    ...leftFiles.map(left => ({ path: left.path, left, right: rightByPath.get(left.path) ?? null })),
    ...rightFiles
      .filter(right => !leftPaths.has(right.path))
      .map(right => ({ path: right.path, left: null, right })),
  ].map(entry => ({ ...entry, status: resolveStatus(entry.left, entry.right) }));
};

export const summarizeCompareFiles = (entries = []) =>
  Object.keys(SKILL_COMPARE_FILE_STATUS_LABELS)
    .map(status => ({ status, count: entries.filter(entry => entry.status === status).length }))
    .filter(({ count }) => count > 0)
    .map(({ status, count }) => `${count} ${SKILL_COMPARE_FILE_STATUS_LABELS[status].toLowerCase()}`)
    .join(' · ');

export const toFieldText = text => withoutByteOrderMark(text)?.replace(/\r\n?/g, '\n');

const splitLines = text => {
  const parts = text.split(/(\r\n|\r|\n)/);
  return parts
    .filter((part, index) => index % 2 === 0)
    .map((body, index) => ({ body, ending: parts[2 * index + 1] ?? '' }));
};

const mostUsedEnding = lines => {
  const counts = new Map();
  lines.forEach(({ ending }) => ending && counts.set(ending, (counts.get(ending) ?? 0) + 1));
  return [...counts].sort((left, right) => right[1] - left[1])[0]?.[0] ?? '\n';
};

const countMatching = (length, isMatch) => {
  let count = 0;
  while (count < length && isMatch(count)) count += 1;
  return count;
};

export const withStoredLineEndings = (fieldText, storedText) => {
  if (!storedText) return fieldText;
  const byteOrderMark = storedText.startsWith(BYTE_ORDER_MARK) ? BYTE_ORDER_MARK : '';
  const stored = splitLines(withoutByteOrderMark(storedText));
  const typed = fieldText.split('\n');
  const shorter = Math.min(stored.length, typed.length);
  const head = countMatching(shorter, index => typed[index] === stored[index].body);
  const tail = countMatching(shorter - head, index => typed.at(-1 - index) === stored.at(-1 - index).body);
  const storedMiddle = stored.slice(head, stored.length - tail);
  const fallbackEnding = mostUsedEnding(stored);
  const endingFor = index => {
    const fromEnd = typed.length - 1 - index;
    let source = storedMiddle[index - head];
    if (index < head) source = stored[index];
    else if (fromEnd < tail) source = stored.at(-1 - fromEnd);
    return source?.ending || fallbackEnding;
  };
  return (
    byteOrderMark +
    typed.map((body, index) => (index === typed.length - 1 ? body : body + endingFor(index))).join('')
  );
};

export const listTreeFiles = folder => [...folder.folders.flatMap(listTreeFiles), ...folder.files];
