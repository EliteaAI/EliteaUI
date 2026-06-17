import { memo, useMemo } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import IWModalEntityCardFullscreenText from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalEntityCardFullscreenText';
import IWModalEntityCardWrapper from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalEntityCardWrapper';
import IWModalEntityTextField from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalEntityTextField';
import IWModalEntityToolkitsField from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalEntityToolkitsField';
import { parseYamlToMermaid } from '@/[fsd]/features/agent/lib/helpers/parseYamlToMermaid.helpers';
import { INTERNAL_TOOLS_LIST } from '@/[fsd]/shared/lib/constants/internalTools.constants';
import AgentIcon from '@/assets/agent.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import FullScreenIconSvg from '@/assets/full-screen-icon.svg?react';
import SkillIcon from '@/assets/skill-icon.svg?react';
import MermaidDiagramOutput from '@/components/MermaidDiagramOutput/DiagramOutput';

const IWModalEntityCard = memo(props => {
  const { entity } = props;

  const styles = iWModalEntityCardStyles();

  const isPipeline = entity?.details?.agent_type === 'pipeline';
  const isSkill = entity?.entity === 'skills';

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
    <IWModalEntityCardWrapper
      icon={isSkill ? <SkillIcon /> : isPipeline ? <FlowIcon /> : <AgentIcon />}
      title={entity.name}
      subtitle={`Type: ${isSkill ? 'skill' : isPipeline ? 'pipeline' : 'agent'}`}
      renderFullscreenContent={fullscreenData =>
        fullscreenData?.isDiagram ? (
          <Box sx={{ height: '34rem', borderRadius: '.5rem', overflow: 'hidden' }}>
            <MermaidDiagramOutput code={mermaidCode} />
          </Box>
        ) : (
          <IWModalEntityCardFullscreenText content={fullscreenData?.content} />
        )
      }
    >
      {setFullscreenData => (
        <>
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

          {isSkill && (
            <Box>
              <Typography sx={styles.label}>Version:</Typography>
              <Typography
                variant="bodyMedium"
                sx={({ palette }) => ({ color: palette.text.secondary })}
              >
                {entity?.details?.name || 'base'}
              </Typography>
            </Box>
          )}

          {!isSkill && (
            <>
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
                description={entity.details.conversation_starters?.join('\n\n')}
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
            </>
          )}
        </>
      )}
    </IWModalEntityCardWrapper>
  );
});

IWModalEntityCard.displayName = 'IWModalEntityCard';

/** @type {MuiSx} */
const iWModalEntityCardStyles = () => ({
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
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
