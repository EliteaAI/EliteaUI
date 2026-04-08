import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';

import IWModalEntityTextField from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalEntityTextField';
import IWModalEntityToolkitsField from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalEntityToolkitsField';
import { parseYamlToMermaid } from '@/[fsd]/features/agent/lib/helpers/parseYamlToMermaid.helpers';
import { INTERNAL_TOOLS_LIST } from '@/[fsd]/shared/lib/constants/internalTools.constants';
import { Modal } from '@/[fsd]/shared/ui';
import AgentIcon from '@/assets/agent.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import FullScreenIconSvg from '@/assets/full-screen-icon.svg?react';
import MermaidDiagramOutput from '@/components/MermaidDiagramOutput/DiagramOutput';

const IWModalEntityCard = memo(props => {
  const { entity } = props;

  const [isExpanded, setIsExpanded] = useState(false);
  const [fullscreenData, setFullscreenData] = useState(null);

  const onCloseFullScreen = useCallback(() => {
    setFullscreenData(null);
  }, []);

  const styles = iWModalEntityCardStyles(isExpanded);

  const isPipeline = entity?.details?.agent_type === 'pipeline';

  const toolkits = useMemo(
    () => entity?.details?.tools?.filter(t => t.type !== 'application') ?? [],
    [entity?.details?.tools],
  );

  const mermaidCode = useMemo(() => {
    if (isPipeline && entity.details.instructions) {
      return parseYamlToMermaid(entity.details.instructions);
    }
    return '';
  }, [isPipeline, entity]);

  return (
    <>
      <Box sx={styles.entityCard}>
        <Box sx={styles.mainBlock}>
          <Box sx={styles.entityIcon}>
            {entity?.details?.agent_type === 'pipeline' ? <FlowIcon /> : <AgentIcon />}
          </Box>
          <Box sx={styles.entityTitles}>
            <Typography sx={styles.titleText}>{entity.name}</Typography>
            <Typography sx={styles.typeText}>
              {`Type: ${entity?.details?.agent_type === 'pipeline' ? 'pipeline' : 'agent'}`}
            </Typography>
          </Box>
          <Button
            sx={styles.actionBtn}
            variant="text"
            color="primary"
            onClick={() => setIsExpanded(prev => !prev)}
            disableRipple
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </Button>
        </Box>

        <Box sx={styles.detailsBlock}>
          <Box sx={styles.detailsInner}>
            <IWModalEntityTextField
              title="Description"
              description={entity.description}
              lineClamp={3}
              setFullscreenData={setFullscreenData}
              height="4rem"
            />

            {isPipeline ? (
              <>
                {mermaidCode && (
                  <Box>
                    <Box sx={styles.titleWrapper}>
                      <Typography sx={styles.label}>Pipeline Diagram:</Typography>
                      <Tooltip
                        title="Full screen view"
                        placement="top"
                      >
                        <IconButton
                          onClick={() =>
                            setFullscreenData({
                              title: 'Pipeline Diagram',
                              content: mermaidCode,
                              isDiagram: true,
                            })
                          }
                          variant="elitea"
                          color="tertiary"
                        >
                          <FullScreenIconSvg />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Box
                      sx={{
                        height: '12.5rem',
                        borderRadius: '.5rem',
                        overflow: 'hidden',
                      }}
                    >
                      <MermaidDiagramOutput code={mermaidCode} />
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <IWModalEntityTextField
                title="Instructions"
                description={entity.details.instructions}
                lineClamp={8}
                setFullscreenData={setFullscreenData}
                height="9rem"
                type="markdown"
              />
            )}

            {Boolean(toolkits.length) && <IWModalEntityToolkitsField toolkits={toolkits} />}

            <IWModalEntityTextField
              title="Welcome message"
              description={entity.details.welcome_message}
              lineClamp={3}
              setFullscreenData={setFullscreenData}
              height="4rem"
              type="markdown"
            />

            <IWModalEntityTextField
              title="Conversation starters"
              description={entity.details.conversation_starters.join('\n\n')}
              lineClamp={3}
              setFullscreenData={setFullscreenData}
              height="4rem"
              type="markdown"
            />

            {Boolean(entity?.details?.internal_tools?.length) && (
              <Box>
                <Typography sx={styles.label}>Internal tools:</Typography>
                <Typography
                  variant="bodyMedium"
                  sx={({ palette }) => ({ color: palette.text.secondary })}
                >
                  {entity.details.internal_tools
                    .map(it => INTERNAL_TOOLS_LIST.find(i => i.name === it)?.title ?? it)
                    .join(',')}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography sx={styles.label}>Other:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: '.35rem', alignItems: 'center' }}>
                <Typography variant="bodyMedium">Step Limit:</Typography>
                <Typography
                  variant="bodyMedium"
                  sx={({ palette }) => ({ color: palette.text.secondary })}
                >
                  {entity?.details?.meta.step_limit}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Modal.BaseModal
        hideSections
        open={Boolean(fullscreenData)}
        title={fullscreenData?.title}
        dialogSx={{ maxHeight: 'unset' }}
        onClose={onCloseFullScreen}
        content={
          fullscreenData?.isDiagram ? (
            <Box
              sx={{
                height: '34rem',
                borderRadius: '.5rem',
                overflow: 'hidden',
              }}
            >
              <MermaidDiagramOutput code={mermaidCode} />
            </Box>
          ) : (
            <Box sx={[styles.textBlock, { height: '34rem', overflowY: 'auto' }]}>
              <Typography
                variant="bodySmall"
                sx={styles.fullScreenText}
                component="p"
              >
                {fullscreenData?.content}
              </Typography>
            </Box>
          )
        }
      />
    </>
  );
});

IWModalEntityCard.displayName = 'IWModalEntityCard';

/** @type {MuiSx} */
const iWModalEntityCardStyles = isExpanded => ({
  entityCard: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem 1rem',
    width: '100%',
    background: palette.background.userInputBackground,
    borderRadius: '.5rem',
    overflow: 'hidden',
  }),
  mainBlock: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: '3.75rem',
  },
  detailsBlock: {
    display: 'grid',
    gridTemplateRows: isExpanded ? '1fr' : '0fr',
    transition: 'grid-template-rows 0.4s ease',
  },
  detailsInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflow: 'hidden',
    paddingTop: isExpanded ? '1.75rem' : '0',
    transition: 'padding-top 0.4s ease',
    marginBottom: isExpanded ? '1rem' : '0',
  },
  entityIcon: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '2.25rem',
    width: '2.25rem',
    minHeight: '2.25rem',
    minWidth: '2.25rem',
    borderRadius: '50%',
    background: 'linear-gradient(225deg, rgba(169, 183, 193, 0.03) 12.64%, rgba(169, 183, 193, 0.17) 87.88%)',

    ':after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      height: '2.1875rem',
      width: '2.1875rem',
      borderRadius: '50%',
      background: 'linear-gradient(45.36deg, rgba(169, 183, 193, 0.3) 16.25%, rgba(80, 86, 91, 0.3) 87.07%)',
      transform: 'translate(-50%, -50%)',
    },
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  entityTitles: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleText: ({ palette }) => ({
    fontWeight: '400',
    fontSize: '.875rem',
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
  typeText: ({ palette }) => ({
    fontWeight: 400,
    fontSize: '.75rem',
    lineHeight: '1.25rem',
    color: palette.text.default,
  }),
  actionBtn: ({ palette }) => ({
    background: 'transparent !important',
    border: 'none !important',
    color: palette.background.button.primary.pressed,
    marginLeft: 'auto',
    whiteSpace: 'nowrap',

    ':hover': {
      color: palette.background.button.primary.hover,
    },
  }),
  textBlock: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '.5rem 1rem',
  }),
  fullScreenText: ({ palette }) => ({
    color: palette.text.secondary,
    lineHeight: '1rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
  label: {
    fontWeight: 500,
    fontSize: '.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '.625rem',
    marginTop: '.25rem',
  },
});

export default IWModalEntityCard;
