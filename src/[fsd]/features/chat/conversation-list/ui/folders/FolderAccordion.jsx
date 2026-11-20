import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Tooltip } from '@/[fsd]/shared/ui';
import { StyledAccordion, StyledAccordionDetails, StyledAccordionSummary } from '@/[fsd]/shared/ui/accordion';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DotMenu from '@/components/DotMenu.jsx';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import FolderIcon from '@/components/Icons/FolderIcon.jsx';
import PinIcon from '@/components/Icons/PinIcon';

const FolderAccordion = memo(props => {
  const {
    items = [],
    showMode = AccordionConstants.AccordionShowMode.LeftMode,
    style,
    slotProps = {
      sx: {},
      summary: {
        sx: {},
      },
      summaryContainer: {
        sx: {},
      },
      detail: {
        sx: {},
      },
    },
    defaultExpanded = false,
    storedExpanded,
    onExpandedChange,
    menuItems,
    isActive,
    is_private,
    onMouseEnter,
    onMouseLeave,
    onShowMenuList,
    onCloseMenuList,
    showMenu,
    isHovering,
    isPinned = false,
    onUnpin,
    folderId,
  } = props;

  // The user's own choice, kept over a remount of the list, wins over the default
  const [expanded, setExpanded] = useState(storedExpanded ?? defaultExpanded);

  const shouldBeSelected = !expanded && defaultExpanded;

  const styles = folderAccordionStyles(
    isActive,
    isHovering,
    expanded,
    is_private,
    showMenu,
    shouldBeSelected,
  );

  const onChange = useCallback(
    (_, value) => {
      setExpanded(value);
      onExpandedChange?.(value);
    },
    [onExpandedChange],
  );

  const handleUnpinClick = useCallback(
    event => {
      event.stopPropagation();
      onUnpin?.();
    },
    [onUnpin],
  );

  // Auto-opens (e.g. its chat gets selected) and keeps that, so a remount does not fold it again
  const prevDefaultExpandedRef = useRef(defaultExpanded);
  useEffect(() => {
    if (defaultExpanded && !prevDefaultExpandedRef.current) {
      setExpanded(true);
      onExpandedChange?.(true);
    }
    prevDefaultExpandedRef.current = defaultExpanded;
  }, [defaultExpanded, onExpandedChange]);

  return (
    <Box sx={style}>
      {items.map(({ title, content }, index) => (
        <StyledAccordion
          showMode={showMode}
          key={index}
          data-testid={folderId != null ? `chat-folder-item-${folderId}` : undefined}
          data-expanded={expanded}
          sx={[styles.accordion, slotProps?.sx]}
          expanded={expanded}
          onChange={onChange}
        >
          <Box
            sx={[styles.summaryContainer, slotProps?.summaryContainer?.sx]}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <StyledAccordionSummary
              expandIcon={
                <Box
                  component="span"
                  data-testid="chat-folder-expand-icon"
                  sx={styles.expandIcon}
                >
                  <ArrowRightIcon />
                </Box>
              }
              aria-controls={'panel-content' + index}
              showMode={showMode}
              sx={[styles.summary, slotProps?.summary?.sx]}
            >
              <Box sx={styles.titleContainer}>
                <FolderIcon
                  data-testid="chat-folder-icon"
                  sx={styles.folderIcon}
                />
                <Tooltip.TypographyWithConditionalTooltip
                  title={title}
                  placement="top"
                  variant="bodySmall2"
                  sx={styles.titleText}
                >
                  {title}
                </Tooltip.TypographyWithConditionalTooltip>
              </Box>
            </StyledAccordionSummary>
            {/* Outside the summary: the summary is a button, and a button cannot hold another one */}
            {isPinned && (
              <StyledTooltip
                title="Unpin"
                placement="top"
              >
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.tertiary}
                  data-testid="chat-folder-pin-button"
                  aria-label="Unpin folder"
                  onClick={handleUnpinClick}
                  startIcon={<PinIcon sx={styles.pinIcon} />}
                  sx={styles.pinButton}
                />
              </StyledTooltip>
            )}
            <Box
              id={'Menu'}
              sx={styles.menuContainer}
            >
              <DotMenu
                id="conversation-menu"
                slotProps={{
                  ListItemText: {
                    sx: styles.menuItemText,
                    primaryTypographyProps: { variant: 'bodyMedium' },
                  },
                  ListItemIcon: {
                    sx: styles.menuItemIcon,
                  },
                }}
                onClose={onCloseMenuList}
                onShowMenuList={onShowMenuList}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                {menuItems}
              </DotMenu>
            </Box>
          </Box>
          <StyledAccordionDetails sx={slotProps?.detail?.sx}>{content}</StyledAccordionDetails>
        </StyledAccordion>
      ))}
    </Box>
  );
});

FolderAccordion.displayName = 'FolderAccordion';

/** @type {MuiSx} */
const folderAccordionStyles = (isActive, isHovering, expanded, is_private, showMenu, shouldBeSelected) => ({
  accordion: {
    background: 'transparent',
  },
  summaryContainer: ({ palette }) => ({
    borderLeft: isActive
      ? `0.1875rem solid ${is_private ? palette.primary.main : palette.status.published}`
      : 0,
    padding: '0.25rem 0.75rem',
    gap: '0.5rem',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '2.25rem',
    boxSizing: 'border-box',
    background: isActive
      ? palette.background.surface.interactive.default
      : shouldBeSelected
        ? palette.components.conversation.background.selected
        : 'transparent',
    borderRadius: isActive ? '0.375rem' : 0,
    ':hover': {
      background: palette.background.surface.interactive.default,
      borderRadius: 0,
    },
    '&:hover #Menu': {
      visibility: 'visible',
    },
  }),
  expandIcon: ({ palette }) => ({
    display: 'flex',
    '& svg': {
      width: '1rem',
      height: '1rem',
      fill: palette.icon.default,
    },
  }),
  summary: {
    overflow: 'hidden',
    minWidth: 0,
    flex: 1,
    '& .MuiAccordionSummary-content': {
      minWidth: 0,
      marginLeft: '0.25rem !important',
    },
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    overflow: 'hidden',
    minWidth: 0,
    flex: 1,
  },
  pinButton: ({ palette }) => ({
    flexShrink: 0,
    minWidth: '1.25rem !important',
    width: '1.25rem',
    height: '1.25rem',
    padding: '0 !important',
    '&:hover path': {
      fill: palette.icon.secondary,
    },
  }),
  pinIcon: {
    fontSize: '0.875rem',
  },
  folderIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    color: palette.icon.secondary,
  }),
  titleText: ({ palette, typography }) => ({
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: palette.text.secondary,
    fontFamily: typography.fontFamily,
    fontFeatureSettings: typography.fontFeatureSettings,
  }),
  menuContainer: {
    height: '100%',
    visibility: showMenu ? 'visible' : 'hidden',
    display: isHovering || showMenu ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  menuItemText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  menuItemIcon: {
    minWidth: '1rem !important',
    marginRight: '0.75rem',
  },
});

export default FolderAccordion;
