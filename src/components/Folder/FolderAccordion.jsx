import { memo, useCallback, useEffect, useState } from 'react';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Tooltip } from '@/[fsd]/shared/ui';
import {
  StyledAccordion,
  StyledAccordionDetails,
  StyledAccordionSummary,
  StyledExpandMoreIcon,
} from '@/[fsd]/shared/ui/accordion';
import DotMenu from '@/components/DotMenu.jsx';
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
    menuItems,
    isActive,
    is_private,
    onMouseEnter,
    onMouseLeave,
    onShowMenuList,
    onCloseMenuList,
    showMenu,
    isHovering,
    isNextFolderHovered = false,
    isPinned = false,
  } = props;

  const [expanded, setExpanded] = useState(defaultExpanded);

  const shouldBeSelected = !expanded && defaultExpanded;

  const styles = folderAccordionStyles(
    isActive,
    isHovering,
    expanded,
    isNextFolderHovered,
    is_private,
    showMenu,
    shouldBeSelected,
  );

  const onChange = useCallback((_, value) => {
    setExpanded(value);
  }, []);

  useEffect(() => {
    if (defaultExpanded) {
      setExpanded(true);
    }
  }, [defaultExpanded]);

  return (
    <Box sx={style}>
      {items.map(({ title, content }, index) => (
        <StyledAccordion
          showMode={showMode}
          key={index}
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
              expandIcon={<StyledExpandMoreIcon sx={styles.expandIcon} />}
              aria-controls={'panel-content' + index}
              showMode={showMode}
              sx={[styles.summary, slotProps?.summary?.sx]}
            >
              <Box sx={styles.titleContainer}>
                <FolderIcon sx={styles.folderIcon} />
                <Tooltip.TypographyWithConditionalTooltip
                  title={title}
                  placement="top"
                  variant="bodySmall2"
                  sx={styles.titleText}
                >
                  {title}
                </Tooltip.TypographyWithConditionalTooltip>
                {isPinned && <PinIcon sx={{ fontSize: '0.875rem' }} />}
              </Box>
            </StyledAccordionSummary>
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
const folderAccordionStyles = (
  isActive,
  isHovering,
  expanded,
  isNextFolderHovered,
  is_private,
  showMenu,
  shouldBeSelected,
) => ({
  accordion: {
    background: 'transparent',
  },
  summaryContainer: ({ palette }) => ({
    borderBottom:
      isActive || isHovering || expanded || isNextFolderHovered || shouldBeSelected
        ? 'none'
        : `0.0625rem solid ${palette.border.conversationItemDivider}`,
    borderLeft: isActive
      ? `0.1875rem solid ${is_private ? palette.primary.main : palette.status.published}`
      : 0,
    padding: '0.75rem 1rem',
    gap: '0.75rem',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '3.0625rem',
    boxSizing: 'border-box',
    background: isActive
      ? palette.background.userInputBackground
      : shouldBeSelected
        ? palette.background.conversation.selected
        : 'transparent',
    borderRadius: isActive ? '0.375rem' : 0,
    ':hover': {
      background: palette.background.userInputBackground,
      borderRadius: 0,
    },
    '&:hover #Menu': {
      visibility: 'visible',
    },
  }),
  expandIcon: ({ palette }) => ({
    width: '0.875rem',
    height: '0.875rem',
    color: palette.icon.fill.secondary,
  }),
  summary: {
    overflow: 'hidden',
    minWidth: 0,
    '& .MuiAccordionSummary-content': {
      minWidth: 0,
    },
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    overflow: 'hidden',
    minWidth: 0,
  },
  folderIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    color: palette.icon.fill.secondary,
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

export { FolderAccordion };
