import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, CardContent, Divider, Card as MuiCard, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { PinButton } from '@/[fsd]/widgets/PinToggler/ui';
import OfflineIcon from '@/assets/offline-icon.svg?react';
import OnlineIcon from '@/assets/online-icon.svg?react';
import PublishIcon from '@/assets/publish-version.svg?react';
import { isApplicationCard } from '@/common/checkCardType';
import { ContentType, ViewMode } from '@/common/constants';
import { getEntityType, getEntityTypeByCardType } from '@/common/utils';
import AuthorContainer from '@/components/AuthorContainer';
import CardTagSection from '@/components/CardTagSection';
import EntityIcon from '@/components/EntityIcon';
import { IconLinkWithToolTip } from '@/components/Fork/IconLinkWithToolTip.jsx';
import HighlightQuery from '@/components/HighlightQuery';
import Like from '@/components/Like';
import useCardNavigate from '@/hooks/useCardNavigate';
import useCardResize from '@/hooks/useCardResize';
import useDataViewMode from '@/hooks/useDataViewMode';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const Card = memo(props => {
  const { data = {}, viewMode: pageViewMode, type, index = 0, customTagClickHandler } = props;

  const projectId = useSelectedProjectId();
  const {
    id,
    name = '',
    authors = [],
    author = {},
    description,
    status,
    meta,
    is_forked: isForked,
    is_pinned: isPinned = false,
  } = data;

  const viewMode = useDataViewMode(pageViewMode, data);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const cardTitleRef = useRef(null);
  const cardRef = useRef(null);
  const { processTagsByCurrentCardWidth } = useCardResize(cardRef, index);
  const { processedTags, extraTagsCount } = processTagsByCurrentCardWidth(
    data.tags,
    type !== ContentType.ToolkitAll && type !== ContentType.ToolkitAdmin ? 0.5 : 0.68,
  );
  const cardAuthors = useMemo(() => {
    return !authors?.length ? (author ? [author] : []) : authors;
  }, [author, authors]);

  const authorsTooltipText = useMemo(() => {
    if (!cardAuthors?.length) return '';
    return cardAuthors
      .map(a => a.name)
      .filter(Boolean)
      .join(', ');
  }, [cardAuthors]);

  // Check if this is a pre-built MCP (e.g., mcp_github) or remote MCP
  const isPrebuildMcp = useMemo(() => McpAuthHelpers.isPrebuildMcpType(data.type), [data.type]);
  const isRemoteMcp = data.type === 'mcp';

  // For pre-built MCPs, navigate to MCP detail page instead of toolkit page
  // This ensures unified experience for all MCP types
  const navigationType = useMemo(() => {
    if (isPrebuildMcp && (type === ContentType.ToolkitAll || type === ContentType.ToolkitAdmin)) {
      return ContentType.MCPAll;
    }
    return type;
  }, [isPrebuildMcp, type]);

  const doNavigate = useCardNavigate({ viewMode, id, type: navigationType, name });

  const handleMouseEnter = useCallback(() => {
    setIsCardHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsCardHovered(false);
  }, []);

  const handlePinChange = useCallback(() => {
    setIsCardHovered(false);
  }, []);

  // Monitor MCP token changes for both remote and pre-built MCP toolkits
  // For remote MCPs, use serverUrl; for pre-built MCPs, use toolkitType
  const mcpTokenOptions = useMemo(() => {
    if (isPrebuildMcp) {
      return { toolkitType: data.type };
    }
    if (isRemoteMcp) {
      return { serverUrl: data?.settings?.url || '' };
    }
    return {};
  }, [isPrebuildMcp, isRemoteMcp, data.type, data?.settings?.url]);

  const { isLoggedIn: hasMcpLoggedIn } = useMcpTokenChange(mcpTokenOptions);

  const styles = cardStyles;

  return (
    <Box
      sx={styles.wrapper}
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <MuiCard sx={styles.card}>
        <CardContent sx={styles.cardContent}>
          <Box
            sx={styles.cardTopSection}
            onClick={doNavigate}
          >
            <EntityIcon
              icon={data.icon_meta}
              entityType={getEntityType(type)}
              projectId={projectId}
              editable={false}
            />
            <StyledTooltip
              key={`title-tooltip-${isPinned ? 'p' : 'u'}-${id}`}
              placement="top"
              enterDelay={1000}
              enterNextDelay={1000}
              title={
                <>
                  <Typography
                    variant="bodySmall2"
                    sx={styles.titleTooltip}
                  >
                    {name || ''}
                  </Typography>
                  <Typography
                    variant="bodySmall2"
                    sx={styles.descriptionTooltip}
                  >
                    {description || ''}
                  </Typography>
                </>
              }
            >
              <Typography
                ref={cardTitleRef}
                color="text.secondary"
                variant="headingSmall"
                sx={styles.cardTitle}
              >
                <HighlightQuery
                  text={name}
                  color="text.secondary"
                  variant="headingSmall"
                />
              </Typography>
            </StyledTooltip>
          </Box>
          <Box sx={styles.cardBottomSection}>
            <Box sx={styles.bottomLeftSection}>
              <StyledTooltip
                key={`nameAuthor-tooltip-${authorsTooltipText}-${id}`}
                placement="top"
                title={authorsTooltipText}
              >
                <Box>
                  <AuthorContainer
                    authors={cardAuthors}
                    showName={false}
                    style={styles.authorContainer}
                  />
                </Box>
              </StyledTooltip>
              {data?.tags?.length > 0 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={styles.sectionDivider}
                />
              )}
              <CardTagSection
                tags={processedTags}
                allTags={data.tags}
                extraTagsCount={extraTagsCount}
                disableClickTags={
                  type === ContentType.ModerationSpaceApplication ||
                  type === ContentType.ModerationSpacePipeline
                }
                dynamic={false}
                customTagClickHandler={customTagClickHandler}
              />
            </Box>
            <Box sx={styles.bottomRightSection}>
              {(status === 'published' || status === 'embedded') && isApplicationCard(type) && (
                <StyledTooltip
                  placement="top"
                  title={status === 'embedded' ? 'Embedded' : 'Published'}
                >
                  <Box sx={styles.publishIconContainer}>
                    <PublishIcon sx={{ fontSize: '1rem' }} />
                  </Box>
                </StyledTooltip>
              )}
              <PinButton
                entityId={id}
                entityType={type}
                initialPinned={isPinned}
                alwaysVisible={isCardHovered}
                onPinChange={handlePinChange}
              />
              {pageViewMode !== ViewMode.Owner && (
                <Box sx={styles.likeContainer}>
                  <Like
                    viewMode={pageViewMode}
                    type={type}
                    data={data}
                  />
                </Box>
              )}
              {isForked && (
                <IconLinkWithToolTip
                  tooltip={name}
                  meta={meta}
                  type={getEntityTypeByCardType(type)}
                />
              )}
              {(type === ContentType.MCPAdmin || type === ContentType.MCPAll) && (
                <StyledTooltip
                  placement="top"
                  title={data.online || hasMcpLoggedIn ? 'Connected' : 'Disconnected'}
                >
                  {data.online || hasMcpLoggedIn ? (
                    <Box sx={styles.mcpIconOnline}>
                      <OnlineIcon />
                    </Box>
                  ) : (
                    <Box sx={styles.mcpIconOffline}>
                      <OfflineIcon />
                    </Box>
                  )}
                </StyledTooltip>
              )}
            </Box>
          </Box>
        </CardContent>
      </MuiCard>
    </Box>
  );
});

Card.displayName = 'Card';

const lineClamp = lines => ({
  width: '100%',
  wordWrap: 'wrap',
  overflowWrap: 'break-word',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: String(lines),
  whiteSpaceCollapse: 'preserve',
});

/** @type {MuiSx} */
const cardStyles = {
  wrapper: {
    width: '100%',
  },
  card: {
    margin: '0.625rem 1.375rem',
    display: 'inline',
    boxSizing: 'border-box',
    '& :last-child': {
      paddingBottom: '0 !important',
    },
  },
  cardContent: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
  },
  cardTopSection: {
    maxHeight: '4.5rem',
    height: '4.5rem',
    cursor: 'pointer',
    width: '100%',
    padding: '1.25rem',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '1rem',
  },
  cardTitle: {
    maxHeight: '3rem',
    ...lineClamp(2),
  },
  titleTooltip: {
    fontWeight: 700,
    ...lineClamp(2),
  },
  descriptionTooltip: {
    ...lineClamp(4),
  },
  cardBottomSection: {
    height: '2.5rem',
    padding: '0 0.75rem 0 1.125rem',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomLeftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  bottomRightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  authorContainer: {
    minWidth: '1.25rem',
  },
  mcpIconOnline: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    color: palette.icon.fill.default,
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
  }),
  mcpIconOffline: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    color: palette.icon.fill.attention,
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
  }),
  sectionDivider: {
    height: '0.9375rem',
    alignSelf: 'center',
  },
  publishIconContainer: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '0.25rem',
    svg: { path: { fill: `${palette.icon.fill.success} !important` } },
  }),
  likeContainer: {
    display: 'flex',
    minWidth: '3.25rem',
    height: '1.75rem',
    '& .icon-size': {
      width: '1rem',
      height: '1rem',
    },
  },
};

export default Card;
