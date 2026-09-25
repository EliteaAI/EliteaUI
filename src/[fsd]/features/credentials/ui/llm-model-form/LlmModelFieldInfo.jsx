import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, ClickAwayListener, Popper, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/components/Icons/CloseIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

import { LlmModelFormConstants } from '../../lib/constants';

const { LLM_MODEL_FIELD_INFO_TEXTS } = LlmModelFormConstants;

const BOLD_SEGMENT = /\*\*(.+?)\*\*/;

const LlmModelFieldInfo = memo(props => {
  const { field, label, isOpen, onToggle, onClose } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [arrowEl, setArrowEl] = useState(null);
  const popoverId = `llm-model-field-info-${field}`;
  const styles = llmModelFieldInfoStyles();

  const handleToggle = useCallback(() => onToggle(field), [field, onToggle]);

  const handleClose = useCallback(() => onClose(field), [field, onClose]);

  const handleClickAway = useCallback(
    event => {
      if (!anchorEl?.contains(event.target)) handleClose();
    },
    [anchorEl, handleClose],
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = event => {
      if (event.key !== 'Escape') return;
      handleClose();
      anchorEl?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, handleClose, anchorEl]);

  const infoSegments = useMemo(() => LLM_MODEL_FIELD_INFO_TEXTS[field].split(BOLD_SEGMENT), [field]);

  const popperModifiers = useMemo(
    () => [
      { name: 'arrow', enabled: true, options: { element: arrowEl } },
      { name: 'offset', options: { offset: [-10, 10] } },
    ],
    [arrowEl],
  );

  return (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.tertiary}
        size="small"
        ref={setAnchorEl}
        aria-label={`About ${label}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        data-testid={`llm-model-info-button-${field}`}
        onClick={handleToggle}
        sx={styles.infoButton}
      >
        <InfoIcon fill="currentColor" />
      </Button.BaseBtn>
      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
        sx={styles.popper}
        modifiers={popperModifiers}
      >
        {({ placement }) => (
          <ClickAwayListener onClickAway={handleClickAway}>
            <Box
              id={popoverId}
              role="dialog"
              aria-label={`About ${label}`}
              data-testid={`llm-model-info-popover-${field}`}
              sx={styles.popover}
            >
              <Box
                ref={setArrowEl}
                sx={styles.arrow(placement)}
              />
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                size="small"
                aria-label="Close"
                onClick={handleClose}
                sx={styles.closeButton}
              >
                <CloseIcon fontSize="small" />
              </Button.BaseBtn>
              <Typography
                variant="bodySmall"
                component="p"
                color="text.secondary"
              >
                {infoSegments.map((segment, index) =>
                  index % 2 ? (
                    <Box
                      component="b"
                      key={index}
                      sx={styles.bold}
                    >
                      {segment}
                    </Box>
                  ) : (
                    segment
                  ),
                )}
              </Typography>
            </Box>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
});

LlmModelFieldInfo.displayName = 'LlmModelFieldInfo';

/** @type {MuiSx} */
const llmModelFieldInfoStyles = () => ({
  infoButton: ({ palette }) => ({
    width: '1.375rem !important',
    height: '1.375rem !important',
    minWidth: '1.375rem !important',
    minHeight: '1.375rem !important',
    padding: 0,
    borderRadius: '50%',
    color: palette.icon.default,
    '&:hover, &[aria-expanded="true"]': {
      color: palette.primary.main,
      backgroundColor: palette.background.surface.interactive.active,
    },
  }),
  popper: ({ zIndex }) => ({
    zIndex: zIndex.tooltip,
  }),
  popover: ({ palette }) => ({
    position: 'relative',
    width: '22.5rem',
    maxWidth: 'calc(100vw - 2rem)',
    padding: '0.875rem 2.25rem 0.875rem 1rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
    boxShadow: palette.boxShadow.listbox,
  }),
  arrow:
    placement =>
    ({ palette }) => {
      const border = `0.0625rem solid ${palette.border.lines}`;
      const isAbove = placement.startsWith('top');
      return {
        position: 'absolute',
        width: '0.625rem',
        height: '0.625rem',
        [isAbove ? 'bottom' : 'top']: '-0.375rem',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundColor: palette.background.default.secondary,
          transform: 'rotate(45deg)',
          ...(isAbove
            ? { borderRight: border, borderBottom: border }
            : { borderLeft: border, borderTop: border }),
        },
      };
    },
  closeButton: ({ palette }) => ({
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    width: '1.5rem !important',
    height: '1.5rem !important',
    minWidth: '1.5rem !important',
    minHeight: '1.5rem !important',
    padding: 0,
    color: palette.icon.default,
  }),
  bold: {
    fontWeight: 600,
  },
});

export default LlmModelFieldInfo;
