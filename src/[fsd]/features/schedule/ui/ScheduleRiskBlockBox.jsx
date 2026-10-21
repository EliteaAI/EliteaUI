import { memo, useMemo } from 'react';

import { Box, Link, List, ListItem, Typography } from '@mui/material';

import { buildEntityEditorLink } from '@/[fsd]/entities/schedule/lib/helpers';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import OpenInNewIcon from '@/assets/open-new-icon.svg?react';

import { toRiskItems } from '../lib/helpers';

const FIX_LINK_TEXT = { agent: 'Open agent to change tools', pipeline: 'Open pipeline to change steps' };

const stepName = ({ step_label, step }) => step_label ?? step;

// Title lines, the line above the list and the closing line of one cause kind
const describeGroup = (code, findings, entityType) => {
  if (code === 'personal_signin_required')
    return {
      title: [`This ${entityType} needs a personal sign-in.`, "Scheduled runs can't sign in for you."],
      intro: "You can't save this schedule. These tools need a person to sign in:",
      items: findings.map(({ toolkit, reason }) => ({ name: toolkit, reason })),
      outro: 'Use a toolkit with a shared project credential instead.',
    };
  if (code === 'human_input_step') {
    const [first, ...rest] = findings;
    const step = stepName(first) ? ` at step '${stepName(first)}'` : '';
    const more = rest.length ? ` and ${rest.length} more ${rest.length === 1 ? 'step' : 'steps'}` : '';
    return {
      title: [`This ${entityType} asks a person for input${step}${more}.`, "Scheduled runs can't answer it."],
      intro: "You can't save this schedule.",
      outro: `Remove the human-input step, or run the ${entityType} from the chat.`,
    };
  }
  if (code === 'missing_credential')
    return {
      title: ['A toolkit has no usable credential.', "Scheduled runs can't work without it."],
      intro: "You can't save this schedule.",
      items: findings.map(({ toolkit }) => ({
        reason: `Toolkit '${toolkit}' has no usable credential for the owner.`,
      })),
    };
  return {
    title: ["You can't save this schedule."],
    items: findings.map(({ message }) => ({ reason: message })),
  };
};

// The red boxes under the entity when the risk check blocks the save: one box per cause kind (owner CR 2026-10-21)
const ScheduleRiskBlockBox = memo(props => {
  const { blocking, entityType, entityId, versionId } = props;
  const groups = useMemo(() => toRiskItems(blocking), [blocking]);
  // A new tab, so the form keeps its input; the editor opens at the version of the form
  const editorLink = `${buildEntityEditorLink({ entityType, entityId })}/${versionId}`;
  const styles = scheduleRiskBlockBoxStyles();

  return groups.map(({ code, findings }) => {
    const { title, intro, items, outro } = describeGroup(code, findings, entityType);
    return (
      <BannerMessage
        key={code}
        variant="error"
      >
        <Box
          data-testid="schedule-risk-block-box"
          sx={styles.body}
        >
          <Box>
            {title.map(line => (
              <Typography
                key={line}
                variant="labelMedium"
                component="p"
                sx={styles.text}
              >
                {line}
              </Typography>
            ))}
          </Box>
          {intro && (
            <Typography
              variant="bodySmall"
              sx={styles.text}
            >
              {intro}
            </Typography>
          )}
          {items?.length > 0 && (
            <List sx={styles.list}>
              {items.map(({ name, reason }, index) => (
                <ListItem
                  key={index}
                  disablePadding
                  sx={styles.item}
                >
                  <Typography
                    variant="bodySmall"
                    sx={styles.text}
                  >
                    {name && (
                      <Box
                        component="span"
                        sx={styles.name}
                      >
                        {name}
                      </Box>
                    )}
                    {name && reason ? `: ${reason}` : reason}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}
          {outro && (
            <Typography
              variant="bodySmall"
              sx={styles.text}
            >
              {outro}
            </Typography>
          )}
          <Link
            href={editorLink}
            target="_blank"
            rel="noopener noreferrer"
            variant="bodySmall"
            sx={styles.link}
          >
            {FIX_LINK_TEXT[entityType]}
            <Box
              component={OpenInNewIcon}
              aria-hidden
              sx={styles.linkIcon}
            />
          </Link>
        </Box>
      </BannerMessage>
    );
  });
});

ScheduleRiskBlockBox.displayName = 'ScheduleRiskBlockBox';

/** @type {MuiSx} */
const scheduleRiskBlockBoxStyles = () => ({
  body: { display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 },
  // text.primary on the 12% red tint keeps 4.5:1 in both themes (spec: tokens)
  text: ({ palette }) => ({ color: palette.text.primary }),
  name: { fontWeight: 600 },
  list: { padding: 0, paddingLeft: '1.25rem', listStyleType: 'disc' },
  item: { display: 'list-item' },
  link: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', alignSelf: 'flex-start' },
  linkIcon: { width: '0.75rem', height: '0.75rem' },
});

export default ScheduleRiskBlockBox;
