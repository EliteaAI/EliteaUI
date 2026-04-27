import React, { Fragment, memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useValidateToolkitImport } from '@/[fsd]/entities/import-wizard/lib/hooks';
import IWModalEntityToolkitsField from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalEntityToolkitsField';
import SuccessIcon from '@/assets/success-icon.svg?react';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

const IWModaSucceedlContent = memo(props => {
  const { data, isForking } = props;
  const styles = iWModaSucceedlContentStyles();

  const { validateToolkitImport } = useValidateToolkitImport();

  const importedItems = useMemo(() => {
    const pipelines = [];
    const agents = [];
    const toolkits = [];

    data.forEach(dataItem => {
      const versionItem = dataItem.version_details;

      if (versionItem.agent_type === 'pipeline') pipelines.push(dataItem.name);
      else agents.push(dataItem.name);

      versionItem.tools.forEach(tool => {
        if (tool.type !== 'application') {
          const { errors, isValid } = validateToolkitImport(tool);

          if (!toolkits.find(t => t.id === tool.id));
          toolkits.push({ id: tool.id, name: tool.name, type: tool.type, isValid, errors });
        }
      });
    });

    return { pipelines, agents, toolkits };
  }, [data, validateToolkitImport]);

  const invalidToolkits = useMemo(
    () => importedItems.toolkits.filter(i => !i.isValid),
    [importedItems.toolkits],
  );

  return (
    <Box sx={styles.root}>
      <Typography sx={[styles.label, { display: 'flex', alignItems: 'center', gap: '0.25rem' }]}>
        {`${isForking ? 'Forked' : 'Imported'}`}:
        <Tooltip
          title="Imported entities use the project's default LLM, Embedding, and PgVector configurations. You can customize these settings individually after import."
          placement="top"
        >
          <Box sx={styles.infoIconWrapper}>
            <InfoIcon
              width={16}
              height={16}
            />
          </Box>
        </Tooltip>
      </Typography>
      <Box>
        {Object.keys(importedItems).map(key => (
          <Fragment key={key}>
            {Boolean(importedItems[key].length) && (
              <Box sx={styles.importedItem}>
                <SuccessIcon />
                <Box sx={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Typography
                    variant="bodyMedium"
                    sx={{ textTransform: 'capitalize', minWidth: '5.25rem', whiteSpace: 'nowrap' }}
                    component="p"
                  >
                    {`${importedItems[key].length} ${key}: `}
                  </Typography>
                  <Typography
                    key={key}
                    variant="bodyMedium"
                    component="p"
                  >
                    {(key === 'toolkits' ? importedItems[key].map(t => t.name) : importedItems[key]).join(
                      ', ',
                    )}
                  </Typography>
                </Box>
              </Box>
            )}
          </Fragment>
        ))}
      </Box>
      {Boolean(invalidToolkits.length) && (
        <Box sx={styles.actionBlock}>
          <Typography sx={styles.label}>Action require:</Typography>
          <Box sx={styles.notificationWrapper}>
            <AttentionIcon />
            <Typography
              component="p"
              sx={styles.warningMessage}
            >
              {`${invalidToolkits.length} toolkit(s) need(s) additional configuration.`}
            </Typography>
          </Box>
          <Box sx={{ margin: '1rem 0' }}>
            <IWModalEntityToolkitsField
              hideTitle
              toolkits={invalidToolkits}
              direction="column"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
});

IWModaSucceedlContent.displayName = 'IWModaSucceedlContent';

/** @type {MuiSx} */
const iWModaSucceedlContentStyles = () => ({
  root: {},
  label: {
    fontWeight: 500,
    fontSize: '.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    margin: '0.5rem 0',
  },
  importedItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginBottom: '0.5rem',

    p: {
      fontWeight: 400,
      fontSize: '.875rem',
      lineHeight: '1.5rem',
      color: palette.text.secondary,
    },

    svg: {
      width: '1rem',
      minWidth: '1rem',
      marginTop: '0.25rem',

      path: {
        fill: palette.icon.fill.success,
      },
    },
  }),
  actionBlock: {
    marginTop: '2rem',
  },

  notificationWrapper: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
    padding: '.75rem 1rem',
    background: palette.background.warning8,
    border: `0.0625rem solid ${palette.background.warning40}`,
    borderRadius: '0.5rem',

    svg: {
      minWidth: '1rem',
      minHeight: '1rem',

      path: {
        fill: palette.background.warning,
      },
    },
  }),

  warningMessage: theme => ({
    fontWeight: 400,
    fontSize: '.75rem',
    lineHeight: '1rem',
    color: theme.palette.text.mcp.logout,
  }),

  infoIconWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    width: '1rem',
    cursor: 'pointer',
    pointerEvents: 'auto',
    marginBottom: '0.15rem',
  },
});

export default IWModaSucceedlContent;
