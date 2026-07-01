import { memo, useCallback, useRef } from 'react';

import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import ProjectAvatar from '@/[fsd]/widgets/sidebar-root/ui/ProjectAvatar';
import ProjectSelect from '@/components/ProjectSelect';

const SidebarProjectSelect = memo(() => {
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const containerRef = useRef(null);

  const styles = sidebarProjectSelectStyles(sideBarCollapsed);

  const handleContainerMouseDown = useCallback(e => {
    if (e.target.closest('[role="combobox"]')) return;
    const select = containerRef.current?.querySelector('[role="combobox"]');
    if (select?.getAttribute('aria-expanded') === 'true') return;
    select?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  }, []);

  const customRenderProject = useCallback(
    option => {
      return (
        <StyledTooltip
          placement="right"
          title={sideBarCollapsed ? option?.label || '' : ''}
          enterDelay={500}
          enterNextDelay={500}
        >
          <Box sx={styles.projectRow}>
            <ProjectAvatar
              projectName={option?.label}
              projectId={option?.value}
              size="1.5rem"
            />
            {!sideBarCollapsed && (
              <Box sx={styles.projectTextBlock}>
                <Typography
                  component="div"
                  variant="labelSmall"
                  sx={styles.projectLabel}
                >
                  Project:
                </Typography>
                <Typography
                  component="div"
                  variant="labelSmall"
                  sx={styles.projectName}
                >
                  {option?.label || 'Loading...'}
                </Typography>
              </Box>
            )}
          </Box>
        </StyledTooltip>
      );
    },
    [sideBarCollapsed, styles],
  );

  const customRenderOption = useCallback(option => {
    return (
      <Box sx={optionStyles.optionRow}>
        <ProjectAvatar
          projectName={option?.label}
          projectId={option?.value}
          size="1.5rem"
        />
        <Typography
          variant="labelMedium"
          color="text.secondary"
          sx={optionStyles.optionLabel}
        >
          {option?.label}
        </Typography>
      </Box>
    );
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={styles.container}
      onMouseDown={handleContainerMouseDown}
    >
      <ProjectSelect
        tourId={SIDEBAR_TOUR_TARGET_IDS.projectSwitcher}
        sx={styles.selectWrapper}
        selectSX={styles.selectSX}
        containerSX={styles.containerSX}
        customRenderValue={customRenderProject}
        customRenderOption={customRenderOption}
        inputSX={styles.inputSX}
        showBorder={false}
        selectPlaceholder={
          <StyledTooltip
            placement="right"
            title={sideBarCollapsed ? 'No projects' : ''}
            enterDelay={500}
            enterNextDelay={500}
          >
            <Box sx={styles.projectRow}>
              <ProjectAvatar
                projectName="?"
                size="1.5rem"
              />
              {!sideBarCollapsed && (
                <Box sx={styles.projectTextBlock}>
                  <Typography
                    component="div"
                    variant="labelSmall"
                    sx={styles.projectLabel}
                  >
                    Project:
                  </Typography>
                  <Typography
                    component="div"
                    variant="labelSmall"
                    sx={styles.projectName}
                  >
                    No projects
                  </Typography>
                </Box>
              )}
            </Box>
          </StyledTooltip>
        }
      />
    </Box>
  );
});

SidebarProjectSelect.displayName = 'SidebarProjectSelect';

const sidebarProjectSelectStyles = sideBarCollapsed => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    boxSizing: 'border-box',
    borderRadius: '0',
    cursor: 'pointer',
    minHeight: '3.5rem',

    '&:hover': {
      backgroundColor: palette.background.button.drawerMenu.hover,
    },
  }),
  projectRow: {
    display: 'flex',
    alignItems: 'center',
    width: sideBarCollapsed ? '1.5rem' : '100%',
    maxWidth: sideBarCollapsed ? '1.5rem' : '100%',
    minWidth: 0,
    gap: '0.5rem',
  },
  projectTextBlock: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
  },
  projectLabel: ({ palette }) => ({
    color: palette.text.metrics,
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '0.625rem',
    fontWeight: 500,
    lineHeight: '1rem',
  }),
  projectName: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.8125rem',
    fontWeight: 500,
    lineHeight: 1.3,
    maxWidth: '7.5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  selectWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: sideBarCollapsed ? 'center' : undefined,
    width: sideBarCollapsed ? 'auto' : '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  containerSX: {
    margin: 0,
    padding: 0,
    width: sideBarCollapsed ? 'auto' : '100%',
    minWidth: 0,
  },
  selectSX: {
    margin: 0,
    width: sideBarCollapsed ? '1.5rem' : '100%',
    '& .MuiInputBase-root.MuiInput-underline:before, & .MuiInputBase-root.MuiInput-underline:after, & .MuiInputBase-root.MuiInput-root:not(.Mui-error, .Mui-disabled).MuiInput-underline:hover:before, & .MuiInputBase-root.MuiInput-underline.Mui-focused:not(.Mui-error):after, & .MuiInputBase-root.MuiInput-underline.Mui-error:before, & .MuiInputBase-root.MuiInput-underline.Mui-error:after':
      {
        borderBottom: 'none !important',
        borderBottomColor: 'transparent !important',
      },
  },
  inputSX: {
    ...(sideBarCollapsed && { width: '1.5rem', minWidth: '1.5rem' }),
    '& .MuiInputBase-input': {
      padding: 0,
    },
    '& .MuiSelect-icon': {
      display: sideBarCollapsed ? 'none' : undefined,
      top: 'calc(50% - 0.5rem) !important',
    },
  },
});

const optionStyles = {
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  optionLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

export default SidebarProjectSelect;
