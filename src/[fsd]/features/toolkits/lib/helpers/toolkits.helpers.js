import { ParticipantEntityTypes } from '@/[fsd]/features/chat/lib/constants/participant.constants';
import { CredentialNameHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { McpConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { getToolIconByType } from '@/common/toolkitUtils';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const parseParametersString = parametersString => {
  // Handle the case where parameters are already in proper format
  if (parametersString.trim().startsWith('{')) {
    try {
      return JSON.parse(parametersString);
    } catch {
      // Continue to manual parsing if JSON parsing fails
    }
  }

  // Parse parameters like: branch=None, blacklist=None, whitelist=None, index_name='markdow'
  const params = {};

  // Split by commas, but be careful with nested objects and arrays
  const parts = [];

  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < parametersString.length; i++) {
    const char = parametersString[i];

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && parametersString[i - 1] !== '\\') {
      inString = false;
      stringChar = '';
    } else if (!inString) {
      if (char === '{' || char === '[') depth++;
      else if (char === '}' || char === ']') depth--;
      else if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());

  // Parse each part
  for (const part of parts) {
    const equalIndex = part.indexOf('=');

    if (equalIndex === -1) continue;

    const key = part.substring(0, equalIndex).trim();
    const value = part.substring(equalIndex + 1).trim();

    // Parse the value
    if (value === 'None' || value === 'null') params[key] = null;
    else if (value === 'True') params[key] = true;
    else if (value === 'False') params[key] = false;
    else if (/^\d+$/.test(value)) params[key] = parseInt(value, 10);
    else if (/^\d*\.?\d+$/.test(value)) params[key] = parseFloat(value);
    else if (value.startsWith("'") && value.endsWith("'")) params[key] = value.slice(1, -1);
    else if (value.startsWith('"') && value.endsWith('"')) params[key] = value.slice(1, -1);
    else if (value.startsWith('{') && value.endsWith('}')) {
      try {
        params[key] = JSON.parse(value);
      } catch {
        params[key] = value;
      }
    } else if (value.startsWith('[') && value.endsWith(']')) {
      try {
        params[key] = JSON.parse(value);
      } catch {
        params[key] = value;
      }
    } else {
      try {
        // Try to parse as JSON if it looks like a stringified object
        if ((value.includes('{') && value.includes('}')) || (value.includes('[') && value.includes(']'))) {
          const parsed = JSON.parse(value);
          params[key] = parsed;
        } else {
          params[key] = value;
        }
      } catch {
        params[key] = value;
      }
    }
  }

  return params;
};

const cleanString = (s, maxLength = 0) => {
  // This pattern matches characters that are NOT alphanumeric, underscores, or hyphens
  const pattern = /[^a-zA-Z0-9_.-]/g;

  // Replace these characters with an empty string and replace '.' with '_'
  const result = typeof s === 'string' ? s?.replace(pattern, '').replace(/\./g, '_') || '' : s;

  // Return the cleaned string, truncated to maxLength if maxLength > 0
  return maxLength > 0 ? result.slice(0, maxLength) : result;
};

const isIndexingResultMessage = parsed =>
  parsed !== null &&
  typeof parsed === 'object' &&
  'status' in parsed &&
  'message' in parsed &&
  typeof parsed.message === 'string';

const prettifyIndexingResultMessage = parsed => {
  const { status, message } = parsed;
  const lines = message.split('\n').filter(Boolean);

  if (lines.length === 0) return message;

  const summaryLines = [];
  const skippedCategories = [];
  let inSkippedSection = false;

  for (const line of lines) {
    // Matches section header like "Skipped items (3 total):"
    if (/^Skipped items \(\d+ total\):/.test(line)) {
      inSkippedSection = true;
      continue;
    }

    if (inSkippedSection) {
      // Matches "  - Category Name (5): file1.txt, file2.zip" — captures name, count, file list
      const categoryMatch = line.match(/^\s*-\s+(.+?)\s+\((\d+)\):\s*(.*)$/);
      if (categoryMatch) {
        const [, name, countStr, filesStr] = categoryMatch;
        const count = parseInt(countStr, 10);
        const files = filesStr
          ? filesStr
              .split(',')
              .map(f => f.trim())
              .filter(Boolean)
          : [];
        skippedCategories.push({ name, count, files });
      }
    } else {
      summaryLines.push(line);
    }
  }

  const output = [];

  if (summaryLines.length > 0) {
    const summaryIcon = status === 'ok' ? '✅ ' : status === 'error' ? '❌ ' : '';
    // Reformat "Successfully indexed 40 documents." → "40 documents - Successfully indexed."
    const reformatted = summaryLines.map(line => {
      const match = line.match(/^(.+?)\s+(\d+\s+\w+)\.?\s*$/);
      return match ? `${match[2]} — ${match[1]}` : line;
    });
    output.push(`${summaryIcon} ${reformatted.join('\n')}`);
  }

  if (skippedCategories.length > 0) {
    for (const cat of skippedCategories) {
      // Categories containing "error", "fail", or "runtime" are treated as failures (❌), others as warnings (⚠️)
      const isError = /error|fail|runtime/i.test(cat.name);
      const icon = isError ? '❌' : '⚠️';
      output.push(`${icon}  ${cat.count} document${cat.count !== 1 ? 's' : ''} — ${cat.name}`);
      for (const file of cat.files) {
        output.push(`    → ${file}`);
      }
    }
  } else if (!summaryLines.length) {
    if (status === 'ok') output.push('✅ Completed successfully');
    else if (status === 'error') output.push('❌ Failed');
  }

  return output.join('\n');
};

const prettifyToolkitMessage = message => {
  if (!message || typeof message !== 'string') return message;

  // Matches a string that is exactly a JSON object (no leading/trailing non-whitespace)
  const jsonPattern = /^(\{[\s\S]*\})$/;
  const match = message.match(jsonPattern);

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);

      if (isIndexingResultMessage(parsed)) return prettifyIndexingResultMessage(parsed);

      return `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
    } catch {
      return message;
    }
  }

  // Matches "Calling tool 'foo' with parameters: ..." — captures tool name and raw params string (s flag allows . to match newlines)
  const toolCallPattern = /^Calling tool '([^']+)' with parameters:\s*(.+)$/s;
  const toolMatch = message.match(toolCallPattern);

  if (toolMatch) {
    const [, toolName, parametersString] = toolMatch;

    try {
      const parameters = parseParametersString(parametersString);
      return `Calling '${toolName}' with parameters:\n\n\n${JSON.stringify(parameters, null, 2)}\n`;
    } catch {
      return `Calling '${toolName}' with parameters:\n\n${parametersString}`;
    }
  }

  return message;
};

export const genToolkitName = (toolkit, schemaOfTools) => {
  // console.warn('If this function ever runs - ask why and fix it.', toolkit)
  const schema = schemaOfTools[toolkit.type] || {};
  const [key] = Object.entries(schema.properties || {}).find(([, value]) => value.toolkit_name) || [];

  if (key)
    return (
      cleanString(toolkit.settings[key] || '') ||
      cleanString(
        toolkit.name || toolkit.settings?.elitea_title || toolkit.settings?.configuration_title || '',
      )
    );

  return cleanString(
    toolkit.name || toolkit.settings?.elitea_title || toolkit.settings?.configuration_title || '',
  );
};

export const prettifyToolkitConversation = messages =>
  messages.map(messageDetails => ({
    ...messageDetails,
    message_items: messageDetails.message_items.map(currentMessage => {
      return {
        ...currentMessage,
        item_details: {
          ...currentMessage.item_details,
          content: prettifyToolkitMessage(currentMessage.item_details.content),
        },
      };
    }),
  }));

export const getToolkitIcon = (toolkit, theme, toolkitSchemas, isMCP) => {
  const typeInfo = toolkitSchemas[toolkit.type];
  // Toolkits from an AppAll context carry meta.application === true.
  // When the type has no dedicated icon, fall back to ApplicationToolkitIcon instead of BuildIcon.
  const isAppAll = toolkit.meta?.application === true;
  const iconComponent = getToolIconByType(toolkit.type, theme, { toolSchema: typeInfo, isMCP, isAppAll });

  // Determine the label
  let label;
  if (isMCP) {
    label = toolkit.type === 'mcp' ? McpConstants.McpCategory.Remote : McpConstants.McpCategory.Local;
  } else {
    // Determine the normalized type
    let type = toolkit.type;
    if (toolkit.type === ToolTypes.application.value) {
      type =
        toolkit.agent_type !== ParticipantEntityTypes.Pipeline
          ? ParticipantEntityTypes.Agent
          : ParticipantEntityTypes.Pipeline;
    }
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    label = typeInfo?.metadata?.label || CredentialNameHelpers.extraCredentialName(capitalizedType);
  }

  return { iconComponent, label };
};

export const enhanceToolkitData = (toolkits, toolkitSchemas, theme, isMCP) => {
  if (!toolkits) return toolkits;

  // Use a Map for better performance with large datasets
  const typeCache = new Map();

  const enhancedToolkits = toolkits.map(toolkit => {
    let cachedIconData = typeCache.get(toolkit.type);

    if (!cachedIconData) {
      const { iconComponent, label } = getToolkitIcon(toolkit, theme, toolkitSchemas, isMCP);
      cachedIconData = {
        iconComponent,
        label,
        tags: [
          {
            id: toolkit.type,
            name: label,
            data: { type: toolkit.type === 'application' ? 'agent' : toolkit.type }, // Normalize 'application' to 'app'
          },
        ],
        icon_meta: {
          component: iconComponent,
          alt: `${label} icon`,
          type: 'component',
        },
      };
      typeCache.set(toolkit.type, cachedIconData);
    }

    return {
      ...toolkit,
      tags: cachedIconData.tags,
      icon_meta: cachedIconData.icon_meta,
      label: cachedIconData.label, // Add label for display
    };
  });

  return enhancedToolkits;
};
