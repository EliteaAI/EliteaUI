import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { useInstructionsInputRefContext } from '@/[fsd]/app/providers';
import { useInstructionsMention } from '@/[fsd]/features/agent/lib/hooks/useInstructionsMention.hooks';
import { AGENT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { FileReaderEnhancer } from '@/[fsd]/shared/ui/input';
import { contextResolver } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useTheme } from '@emotion/react';

import InstructionsSlashSuggestionList from './InstructionsSlashSuggestionList';

/**
 * Renders the mirror overlay content using plain <span> elements only — no MUI Typography —
 * so font metrics are purely inherited from the mirror container (which is synced to the textarea).
 */
const renderMirrorHighlights = (text, ranges, textColor, highlightColor) => {
  if (!ranges?.length || !text) return null;
  const parts = [];
  let lastIndex = 0;
  for (const { start, end } of ranges) {
    if (start > lastIndex) {
      parts.push(
        <span
          key={`n-${lastIndex}`}
          style={{ color: textColor }}
        >
          {text.slice(lastIndex, start)}
        </span>,
      );
    }
    parts.push(
      <span
        key={`h-${start}`}
        style={{ color: highlightColor }}
      >
        {text.slice(start, end)}
      </span>,
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) {
    parts.push(
      <span
        key={`n-${lastIndex}`}
        style={{ color: textColor }}
      >
        {text.slice(lastIndex)}
      </span>,
    );
  }
  return parts;
};

const InstructionsInput = memo(props => {
  const { style, containerStyle, disabled, applicationId, entityProjectId } = props;
  const theme = useTheme();
  const inputRef = useInstructionsInputRefContext();
  const mirrorRef = useRef(null);
  const styles = instructionsInputStyles();
  const {
    values: { version_details },
    setFieldValue,
  } = useFormikContext();
  const selectedProjectId = useSelectedProjectId();
  const projectId = entityProjectId || selectedProjectId;

  const handleChange = useCallback(field => value => setFieldValue(field, value), [setFieldValue]);

  const updateVariableList = useCallback(
    value => {
      const resolvedInputValue = contextResolver(value);
      setFieldValue(
        'version_details.variables',
        resolvedInputValue.map(key => {
          const prevValue = (version_details?.variables || []).find(v => v.name === key);
          return {
            name: key,
            value: prevValue?.value || '',
            id: prevValue?.id || undefined,
          };
        }),
      );
    },
    [setFieldValue, version_details?.variables],
  );

  // ── Mention hook ──────────────────────────────────────────────────────────────

  const {
    phase,
    selectedItem,
    committedMentions,
    filteredItems,
    filteredTools,
    highlightedIndex,
    highlightRanges,
    codeMirrorExtensions,
    onKeyDown: mentionOnKeyDown,
    onInstructionsInputChange,
    onSelectItem,
    onSelectTool,
    resetSlash,
  } = useInstructionsMention({
    fileReaderRef: inputRef,
    applicationId,
    projectId,
    versionDetails: version_details,
  });

  const hasHighlights = highlightRanges.length > 0;

  // Sync the mirror div's geometry (position, size, padding) and scroll with the textarea.
  useEffect(() => {
    if (!hasHighlights) return;
    const textareaEl = inputRef.current?.getTextareaElement?.();
    const mirror = mirrorRef.current;
    if (!textareaEl || !mirror) return;

    const syncGeometry = () => {
      const containerEl = mirror.parentElement;
      const containerRect = containerEl.getBoundingClientRect();
      const textareaRect = textareaEl.getBoundingClientRect();
      const cs = window.getComputedStyle(textareaEl);
      mirror.style.top = textareaRect.top - containerRect.top + 'px';
      mirror.style.left = textareaRect.left - containerRect.left + 'px';
      mirror.style.width = textareaEl.offsetWidth + 'px';
      mirror.style.height = textareaEl.offsetHeight + 'px';
      mirror.style.paddingTop = cs.paddingTop;
      mirror.style.paddingBottom = cs.paddingBottom;
      mirror.style.paddingLeft = cs.paddingLeft;
      mirror.style.paddingRight = cs.paddingRight;
      // Copy font metrics so text wraps at the same positions as in the textarea.
      mirror.style.fontFamily = cs.fontFamily;
      mirror.style.fontSize = cs.fontSize;
      mirror.style.fontWeight = cs.fontWeight;
      mirror.style.lineHeight = cs.lineHeight;
      mirror.style.letterSpacing = cs.letterSpacing;
    };

    const syncScroll = () => {
      mirror.scrollTop = textareaEl.scrollTop;
    };

    // Sync after cursor moves (keyup/click may cause textarea to auto-scroll to cursor).
    // requestAnimationFrame defers until after the browser finishes the scroll.
    const syncScrollAfterFrame = () => requestAnimationFrame(syncScroll);

    syncGeometry();
    syncScroll();
    textareaEl.addEventListener('scroll', syncScroll);
    textareaEl.addEventListener('keyup', syncScrollAfterFrame);
    textareaEl.addEventListener('click', syncScrollAfterFrame);
    const ro = new ResizeObserver(() => {
      syncGeometry();
      syncScroll();
    });
    ro.observe(textareaEl);
    return () => {
      textareaEl.removeEventListener('scroll', syncScroll);
      textareaEl.removeEventListener('keyup', syncScrollAfterFrame);
      textareaEl.removeEventListener('click', syncScrollAfterFrame);
      ro.disconnect();
    };
  }, [hasHighlights, inputRef]);

  const overlayContent = hasHighlights ? (
    <Box
      ref={mirrorRef}
      aria-hidden="true"
      sx={styles.mirrorOverlay}
    >
      {renderMirrorHighlights(
        version_details?.instructions ?? '',
        highlightRanges,
        theme.palette.text.secondary,
        theme.palette.primary.main,
      )}
    </Box>
  ) : null;

  // ── Modal / suggestion list ───────────────────────────────────────────────────

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Intercept onChange so the mention hook tracks the current textarea content.
  const handleInstructionsChange = useCallback(
    value => {
      handleChange('version_details.instructions')(value);
      onInstructionsInputChange(value);
    },
    [handleChange, onInstructionsInputChange],
  );

  const suggestionList = (
    <InstructionsSlashSuggestionList
      phase={phase}
      filteredItems={filteredItems}
      filteredTools={filteredTools}
      selectedItem={selectedItem}
      committedMentions={committedMentions}
      highlightedIndex={highlightedIndex}
      onSelectItem={onSelectItem}
      onSelectTool={onSelectTool}
      onClose={resetSlash}
    />
  );

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
      items={[
        {
          title: 'Instructions',
          content: (
            <Box
              sx={styles.wrapper}
              data-tour={AGENT_TOUR_TARGET_IDS.instructions}
            >
              <Box sx={containerStyle}>
                <FileReaderEnhancer
                  ref={inputRef}
                  showexpandicon="true"
                  id="application-instructions"
                  placeholder="Guidelines for the AI agent"
                  defaultValue={version_details?.instructions}
                  onChange={handleInstructionsChange}
                  updateVariableList={updateVariableList}
                  key={version_details?.id}
                  multiline
                  disabled={disabled}
                  fieldName={'Instructions'}
                  onKeyDown={mentionOnKeyDown}
                  onRealtimeChange={onInstructionsInputChange}
                  onFullScreenChange={setIsModalOpen}
                  afterContent={suggestionList}
                  overlayContent={overlayContent}
                  codeMirrorExtensions={codeMirrorExtensions}
                  sx={hasHighlights ? styles.transparentInput : undefined}
                />
              </Box>
              {!isModalOpen && suggestionList}
            </Box>
          ),
        },
      ]}
    />
  );
});

InstructionsInput.displayName = 'InstructionsInput';

export default InstructionsInput;

/** @type {MuiSx} */
const instructionsInputStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  // Mirror div — position/size/padding/font all synced from the textarea via JS.
  // overflow: scroll creates a real scroll container so scrollTop sync works when content overflows.
  mirrorOverlay: ({ palette }) => ({
    position: 'absolute',
    overflow: 'scroll',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
    pointerEvents: 'none',
    zIndex: 0,
    boxSizing: 'border-box',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: palette.text.primary,
  }),
  // Make textarea text transparent so the mirror overlay shows through.
  transparentInput: ({ palette }) => ({
    '.MuiInputBase-input': {
      color: 'transparent',
      caretColor: palette.text.primary,
    },
  }),
});
