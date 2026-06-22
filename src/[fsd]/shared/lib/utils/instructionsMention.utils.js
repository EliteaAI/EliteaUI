import { RangeSetBuilder, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';

// ── Item type helpers ─────────────────────────────────────────────────────────

export const isToolkitItem = tool => tool.type !== 'application';

export const getItemDescription = tool => {
  if (tool.type === 'application') {
    return tool.agent_type === 'pipeline' ? 'Pipeline' : 'Agent';
  }
  return 'Toolkit';
};

/**
 * Returns the Set of valid tool names for a toolkit item, or null if the
 * item has no settings (meaning validation is not possible and all names are accepted).
 */
const getValidToolNames = item => {
  if (!item.settings) return null;
  const isMcp = item.type === 'mcp' || item.type?.startsWith('mcp_');
  if (isMcp) {
    return new Set((item.settings.available_mcp_tools || []).map(t => t.value || t.label));
  }
  return new Set(item.settings.selected_tools || []);
};

// ── Mention range parser ──────────────────────────────────────────────────────

/**
 * Scans `text` for mention tokens matching entries in `mentionableItems`.
 * Handles both '/' and '#' as the toolkit/tool separator for backwards compatibility.
 * A leading '/' must be preceded by start-of-text or whitespace.
 *
 * @param {string} text
 * @param {Array}  mentionableItems - [{name, isToolkit, ...}]
 * @param {string} triggerChar - leading mention char ("/" for tools, "~" for skills). Default "/".
 * @returns {Array<{start: number, end: number}>} sorted ascending
 */
export const parseMentionRanges = (text, mentionableItems, triggerChar = '/') => {
  if (!text || !mentionableItems?.length) return [];

  const ranges = [];
  // Longest name first so a shorter prefix does not shadow a longer name at the same position.
  const sortedItems = [...mentionableItems].sort((a, b) => b.name.length - a.name.length);

  for (const item of sortedItems) {
    const baseToken = triggerChar + item.name;
    let pos = text.indexOf(baseToken);
    while (pos !== -1) {
      const prevChar = pos > 0 ? text[pos - 1] : '';
      if (prevChar === '' || /\s/.test(prevChar)) {
        const after = text.slice(pos + baseToken.length);
        let end;
        if (item.isToolkit && (after.startsWith('/') || after.startsWith('#'))) {
          // /Name/ToolName or /Name#ToolName — both separators supported
          const toolMatch = after.slice(1).match(/^([^\s/#]+)/);
          if (toolMatch) {
            const toolName = toolMatch[1];
            const validToolNames = getValidToolNames(item);
            // Only extend highlight to the tool name if it is a valid tool in this toolkit.
            if (!validToolNames || validToolNames.has(toolName)) {
              end = pos + baseToken.length + 1 + toolName.length;
            }
            // If tool name is invalid, skip this occurrence entirely (no highlight).
          } else {
            // Separator present but no tool name — highlight the toolkit name only.
            end = pos + baseToken.length;
          }
        } else if (after === '' || /[\s/#]/.test(after[0])) {
          end = pos + baseToken.length;
        }
        if (end !== undefined && !ranges.some(r => pos < r.end && end > r.start)) {
          ranges.push({ start: pos, end });
        }
      }
      pos = text.indexOf(baseToken, pos + 1);
    }
  }

  return ranges.sort((a, b) => a.start - b.start);
};

// ── CodeMirror extension factory ──────────────────────────────────────────────

/**
 * Creates a CodeMirror extension that highlights mention tokens within the editor content.
 * Matches tokens using parseMentionRanges so both '/' and '#' separators are highlighted.
 *
 * @param {Array}  mentionableItems - [{name, isToolkit, ...}]
 * @param {string} primaryColor     - CSS color for highlighted text
 * @param {string} triggerChar      - leading mention char ("/" or "~"). Default "/".
 * @returns {Array} CodeMirror extensions (empty array if nothing to highlight)
 */
export const createMentionCmExtension = (mentionableItems, primaryColor, triggerChar = '/') => {
  if (!mentionableItems?.length) return [];

  const highlightMark = Decoration.mark({ class: 'cm-mention-highlight' });

  const computeDecorations = state => {
    const text = state.doc.toString();
    const decorationRanges = parseMentionRanges(text, mentionableItems, triggerChar);
    const builder = new RangeSetBuilder();
    for (const { start, end } of decorationRanges) {
      builder.add(start, end, highlightMark);
    }
    return builder.finish();
  };

  return [
    EditorView.theme({ '.cm-mention-highlight': { color: primaryColor } }),
    StateField.define({
      create: computeDecorations,
      update(decorations, tr) {
        if (!tr.docChanged) return decorations;
        return computeDecorations(tr.state);
      },
      provide: f => EditorView.decorations.from(f),
    }),
  ];
};
