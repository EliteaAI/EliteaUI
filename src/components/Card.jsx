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
import { getEntityType, getEntityTypeByCardType, getStatusColor } from '@/common/utils';
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

  const styles = cardStyles(status);

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
                  <Typography sx={styles.titleTooltip}>{name || ''}</Typography>
                  <Typography sx={styles.descriptionTooltip}>{description || ''}</Typography>
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
          <Box
            sx={styles.cardBottomSection}
            color="text.secondary"
          >
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
              {status === 'published' && isApplicationCard(type) && (
                <StyledTooltip
                  placement="top"
                  title="Published"
                >
                  <Box
                    sx={({ palette }) => ({
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',

                      svg: { path: { fill: `${palette.icon.fill.success} !important` } },
                    })}
                  >
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

/** @type {MuiSx} */
const cardStyles = status => ({
  wrapper: {
    width: '100%',
  },
  statusIndicator: theme => ({
    width: '0.1875rem',
    height: '1rem',
    position: 'absolute',
    left: '0.0625rem',
    top: '2rem',
    borderRadius: '0.25rem',
    background: getStatusColor(status, theme),
  }),
  card: ({ palette }) => ({
    width: '19.7083rem',
    height: '8.25rem',
    maxHeight: '8.25rem',
    margin: '0.625rem 1.375rem',
    background: palette.background.secondary,
    minWidth: '17.1875rem',
    display: 'inline',
    paddingBottom: '0 !important',
    boxSizing: 'border-box',
    '& :last-child': {
      paddingBottom: '0 !important',
    },
  }),
  cardContent: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
  },
  cardTopSection: {
    maxHeight: '5rem',
    height: '5rem',
    cursor: 'pointer',
    width: '100%',
    padding: '1rem 1.5rem',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '1rem',
  },
  cardTitle: {
    maxHeight: '3rem',
    width: '100%',
    wordWrap: 'wrap',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '2',
    whiteSpaceCollapse: 'preserve',
  },
  cardBottomSection: ({ palette }) => ({
    borderTop: `0.0625rem solid ${palette.border.cardsOutlines}`,
    height: '3.25rem',
    padding: '0 1.25rem',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  titleTooltip: {
    fontWeight: 700,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    width: '100%',
    wordWrap: 'wrap',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '2',
    whiteSpaceCollapse: 'preserve',
  },
  descriptionTooltip: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    width: '100%',
    wordWrap: 'wrap',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '4',
    whiteSpaceCollapse: 'preserve',
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
  likeContainer: {
    display: 'flex',
    minWidth: '3.25rem',
    height: '1.75rem',
    '& .icon-size': {
      width: '1rem',
      height: '1rem',
    },
  },
});

export default Card;
