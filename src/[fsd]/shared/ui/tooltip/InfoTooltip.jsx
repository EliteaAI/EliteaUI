import { isValidElement, memo, useCallback, useMemo } from 'react';

import { Box, Tooltip } from '@mui/material';

import TooltipMarkdownContent from '@/[fsd]/shared/ui/tooltip/TooltipMarkdownContent';
import InfoIcon from '@/components/Icons/InfoIcon';

const INFO_TOOLTIP_DEFAULTS = {
  placement: 'top',
  zIndex: 9999,
  icon: { width: 16, height: 16 },
};

const InfoTooltip = memo(props => {
  const {
    infoTooltip,
    slotProps,
    sx,
    href,
    linkTarget = '_blank',
    rel = 'noopener noreferrer',
    disableTooltip = false,
    TitleComponent,
    titleComponentProps,
    testId,
    contentTestId,
  } = props;
  const styles = infoTooltipStyles();

  const parseInfoTooltip = useCallback((tooltip, sProps) => {
    if (!tooltip) return null;
    const isObject = typeof tooltip === 'object' && !isValidElement(tooltip);
    if (isValidElement(tooltip)) {
      return {
        title: tooltip,
        placement: sProps?.tooltip?.placement ?? INFO_TOOLTIP_DEFAULTS.placement,
        zIndex: sProps?.tooltip?.zIndex ?? INFO_TOOLTIP_DEFAULTS.zIndex,
        icon: {
          width: sProps?.tooltip?.icon?.width ?? INFO_TOOLTIP_DEFAULTS.icon.width,
          height: sProps?.tooltip?.icon?.height ?? INFO_TOOLTIP_DEFAULTS.icon.height,
          fill: sProps?.tooltip?.icon?.fill,
        },
      };
    }

    return {
      title: isObject ? tooltip.title : tooltip,
      placement: isObject
        ? (tooltip.placement ?? INFO_TOOLTIP_DEFAULTS.placement)
        : INFO_TOOLTIP_DEFAULTS.placement,
      zIndex: isObject
        ? (tooltip.zIndex ?? INFO_TOOLTIP_DEFAULTS.zIndex)
        : (sProps?.tooltip?.zIndex ?? INFO_TOOLTIP_DEFAULTS.zIndex),
      icon: {
        width: isObject
          ? (tooltip.icon?.width ?? INFO_TOOLTIP_DEFAULTS.icon.width)
          : INFO_TOOLTIP_DEFAULTS.icon.width,
        height: isObject
          ? (tooltip.icon?.height ?? INFO_TOOLTIP_DEFAULTS.icon.height)
          : INFO_TOOLTIP_DEFAULTS.icon.height,
        fill: isObject ? tooltip.icon?.fill : undefined,
      },
    };
  }, []);

  const tooltipConfig = useMemo(
    () => parseInfoTooltip(infoTooltip, slotProps),
    [parseInfoTooltip, infoTooltip, slotProps],
  );

  if (!tooltipConfig) return null;

  const boxProps = href ? { component: 'a', href, target: linkTarget, rel } : {};

  const iconElement = (
    <Box
      data-info-tooltip
      data-testid={testId}
      sx={[styles.iconContainer, sx]}
      component="span"
      {...boxProps}
    >
      <InfoIcon
        width={tooltipConfig.icon.width}
        height={tooltipConfig.icon.height}
        fill={tooltipConfig.icon.fill}
      />
    </Box>
  );

  if (disableTooltip) return iconElement;

  const resolvedTitleProps = titleComponentProps ?? (typeof infoTooltip === 'object' ? infoTooltip : {});
  let titleContent;
  if (TitleComponent) {
    titleContent = <TitleComponent {...resolvedTitleProps} />;
  } else if (isValidElement(tooltipConfig.title)) {
    titleContent = tooltipConfig.title;
  } else {
    titleContent = <TooltipMarkdownContent>{tooltipConfig.title}</TooltipMarkdownContent>;
  }

  // Caller-scoped testid on the popper CONTENT wrapper — opt-in only (per
  // the shared-component testid ruling, `.agents/testing.md` § Locator
  // policy: shared components never hardcode a feature-scoped testid).
  // Wrapping only fires when a caller passes `contentTestId`, so the DOM
  // for every other InfoTooltip instance on the page (e.g. Pgvector
  // Configuration, Embedding Model on the Artifact toolkit form) is
  // unchanged. Added for ELITEA-1866 — see toolkit_creation_page.py's
  // get_bucket_info_tooltip_text().
  if (contentTestId) {
    titleContent = <Box data-testid={contentTestId}>{titleContent}</Box>;
  }

  return (
    <Tooltip
      title={titleContent}
      placement={tooltipConfig.placement}
      slotProps={{
        popper: {
          sx: {
            zIndex: tooltipConfig.zIndex,
          },
        },
      }}
    >
      {iconElement}
    </Tooltip>
  );
});

InfoTooltip.displayName = 'InfoTooltip';

const infoTooltipStyles = () => ({
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    height: '100%',
    position: 'relative',
    cursor: 'pointer',
    overflow: 'visible',
    '& :hover': { opacity: 0.8 },
  },
});

export default InfoTooltip;
