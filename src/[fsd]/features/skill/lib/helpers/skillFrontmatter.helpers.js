import yaml from 'js-yaml';

const SKILL_FRONTMATTER_KEYS = ['name', 'description'];
const FRONTMATTER_OPENING_LINE = /^---[ \t]*\r?\n/;
const FRONTMATTER_CLOSING_LINE = /^---[ \t]*(?:\r?\n|$)/m;
const LINE_BREAK_BEFORE_BODY = /^\r?\n/;
const FINAL_LINE_BREAK = /\r?\n$/;
const LINE_BREAK = /\r?\n/;
const TOP_LEVEL_LINE = /^\S/;

const locateFrontmatter = text => {
  const opening = FRONTMATTER_OPENING_LINE.exec(text);
  if (!opening) return null;

  const yamlStart = opening[0].length;
  const closing = FRONTMATTER_CLOSING_LINE.exec(text.slice(yamlStart));
  if (!closing) return { yamlStart, yamlEnd: text.length, bodyStart: null };

  const yamlEnd = yamlStart + closing.index;
  const closingEnd = yamlEnd + closing[0].length;
  const lineBreakBeforeBody = LINE_BREAK_BEFORE_BODY.exec(text.slice(closingEnd));
  return { yamlStart, yamlEnd, bodyStart: closingEnd + (lineBreakBeforeBody?.[0].length ?? 0) };
};

const readYamlMapping = (yamlText, schema = yaml.FAILSAFE_SCHEMA) => {
  try {
    const parsed = yaml.load(yamlText, { schema }) ?? {};
    return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const omitSkillFrontmatterKeys = mapping =>
  Object.fromEntries(Object.entries(mapping).filter(([key]) => !SKILL_FRONTMATTER_KEYS.includes(key)));

const formatExtraFrontmatter = frontmatter =>
  frontmatter && Object.keys(frontmatter).length
    ? yaml.dump(frontmatter, { lineWidth: -1, schema: yaml.CORE_SCHEMA })
    : '';

const isEmptyFrontmatterValue = value =>
  !value || (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length);

const formatFrontmatterEntry = (key, value) => {
  if (!isEmptyFrontmatterValue(value)) {
    return yaml.dump({ [key]: value }, { lineWidth: -1 }).replace(FINAL_LINE_BREAK, '');
  }
  return SKILL_FRONTMATTER_KEYS.includes(key) ? `${key}:` : null;
};

const replaceFrontmatterEntry = (lines, key, entry) => {
  const keyLine = new RegExp(`^${key}[ \\t]*:`);
  const start = lines.findIndex(line => keyLine.test(line));
  if (start === -1) return entry === null ? lines : [...lines, entry];

  const nextTopLevelLine = lines.findIndex((line, index) => index > start && TOP_LEVEL_LINE.test(line));
  const end = nextTopLevelLine === -1 ? lines.length : nextTopLevelLine;
  const valueLines = lines.slice(start + 1, end);
  const trailingBlankLineCount = valueLines.length - (valueLines.findLastIndex(line => line.trim()) + 1);
  const entryLines = entry === null ? [] : [entry];
  return [...lines.slice(0, start), ...entryLines, ...lines.slice(end - trailingBlankLineCount)];
};

export const composeSkillEditorText = ({ name, description, frontmatter, body }) =>
  `---\n${formatFrontmatterEntry('name', name)}\n${formatFrontmatterEntry('description', description)}\n${formatExtraFrontmatter(frontmatter)}---\n\n${body}`;

const locateValidFrontmatter = text => {
  const location = locateFrontmatter(text);
  if (!location || location.bodyStart === null) return null;

  const yamlText = text.slice(location.yamlStart, location.yamlEnd);
  const mapping = readYamlMapping(yamlText);
  return mapping ? { ...location, mapping, typedMapping: readYamlMapping(yamlText, yaml.CORE_SCHEMA) } : null;
};

export const parseSkillEditorText = text => {
  const frontmatter = locateValidFrontmatter(text);
  if (!frontmatter) return { body: text, fields: {} };

  const { mapping, typedMapping } = frontmatter;
  const fields = Object.fromEntries(
    SKILL_FRONTMATTER_KEYS.filter(key => typeof mapping[key] === 'string' && mapping[key].trim()).map(key => [
      key,
      mapping[key],
    ]),
  );
  return {
    body: text.slice(frontmatter.bodyStart),
    fields,
    extraFrontmatter: typedMapping ? omitSkillFrontmatterKeys(typedMapping) : undefined,
  };
};

export const writeSkillFrontmatterFields = (text, fields, changedKeys) => {
  const frontmatter = locateValidFrontmatter(text);
  if (!frontmatter) {
    return FRONTMATTER_OPENING_LINE.test(text) ? text : composeSkillEditorText({ ...fields, body: text });
  }

  const yamlText = text.slice(frontmatter.yamlStart, frontmatter.yamlEnd);
  const lines = yamlText ? yamlText.replace(FINAL_LINE_BREAK, '').split(LINE_BREAK) : [];
  const nextLines = changedKeys.reduce(
    (currentLines, key) =>
      replaceFrontmatterEntry(currentLines, key, formatFrontmatterEntry(key, fields[key])),
    lines,
  );
  const nextYamlText = nextLines.length ? `${nextLines.join('\n')}\n` : '';
  return `${text.slice(0, frontmatter.yamlStart)}${nextYamlText}${text.slice(frontmatter.yamlEnd)}`;
};

export const replaceSkillEditorBody = (text, body, fields) => {
  const frontmatter = locateValidFrontmatter(text);
  if (frontmatter) return `${text.slice(0, frontmatter.bodyStart)}${body}`;
  return FRONTMATTER_OPENING_LINE.test(text) ? composeSkillEditorText({ ...fields, body }) : body;
};

export const countSkillBodyLength = text => parseSkillEditorText(text).body.length;
