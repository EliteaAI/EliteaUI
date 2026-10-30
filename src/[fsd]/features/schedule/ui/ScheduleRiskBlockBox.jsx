import { memo, useMemo } from 'react';

import { Box, Link, List, ListItem, Typography } from '@mui/material';

import { buildEntityEditorLink } from '@/[fsd]/entities/schedule';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import OpenInNewIcon from '@/assets/open-new-icon.svg?react';
import { SearchParams, ViewMode } from '@/common/constants';

import { toRiskItems } from '../lib/helpers';

const FIX_LINK_TEXT = { agent: 'Open agent to change tools', pipeline: 'Open pipeline to change steps' };
const WAIT_LINK_TEXT = {
  agent: 'Open agent to sign in or add credentials',
  pipeline: 'Open pipeline to sign in or add credentials',
};
const WAIT_NOTE = 'You can save this schedule. With "Pause and ask me", the run waits for your approval.';

const stepName = ({ step_label, step }) => step_label ?? step;

// Title lines, the line above the list and the closing line of one cause kind.
// `waiting` is the yellow box: the save goes on and the run waits for the owner.
const describeGroup = (code, findings, entityType, waiting) => {
  if (waiting && code === 'personal_signin_required')
    return {
      title: [`This ${entityType} needs a personal sign-in.`, 'The run waits until you sign in and approve.'],
      intro: WAIT_NOTE,
      items: findings.map(({ toolkit, reason }) => ({ name: toolkit, reason })),
      outro: 'Sign in to these toolkits, or use a toolkit with a shared project credential.',
    };
  if (waiting && code === 'missing_credential')
    return {
      title: ['A toolkit has no usable credential.', 'The run waits until you add one and approve.'],
      intro: WAIT_NOTE,
      items: findings.map(({ toolkit }) => ({
        reason: `Toolkit '${toolkit}' has no usable credential for the owner.`,
      })),
      outro: 'Add the credential in the toolkit settings.',
    };
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

// The boxes under the entity when the risk check finds a cause: one box per cause kind. Red boxes block the
// save; with `waiting` the boxes are yellow, the save goes on and the run waits for the owner.
const ScheduleRiskBlockBox = memo(props => {
  const { blocking, waiting = false, entityType, entityId, versionId, projectId } = props;
  const groups = useMemo(() => toRiskItems(blocking), [blocking]);
  const styles = scheduleRiskBlockBoxStyles();

  return groups.map(({ code, findings }) => {
    const { title, intro, items, outro } = describeGroup(code, findings, entityType, waiting);
    // The server names what to fix; the form entity and version stand in when it does not
    const fix = findings.find(finding => finding.fix)?.fix ?? {
      entity_type: entityType,
      id: entityId,
      version_id: versionId,
    };
    // A new tab, so the form keeps its input; it is outside the router, so the URL carries the
    // origin, the router basename and the project segment
    const entityLink = buildEntityEditorLink({ entityType: fix.entity_type, entityId: fix.id });
    const editorLink = NavigationHelpers.buildAbsoluteAppUrl(
      projectId,
      // The editor route opens only in the owner view mode
      `${fix.version_id ? `${entityLink}/${fix.version_id}` : entityLink}?${SearchParams.ViewMode}=${ViewMode.Owner}`,
    );
    return (
      <BannerMessage
        key={code}
        variant={waiting ? 'warning' : 'error'}
      >
        <Box
          data-testid={waiting ? 'schedule-risk-wait-box' : 'schedule-risk-block-box'}
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
            {(waiting ? WAIT_LINK_TEXT : FIX_LINK_TEXT)[fix.entity_type]}
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
