import { memo, useId } from 'react';

import { Box, Chip, Radio, RadioGroup, Typography, alpha } from '@mui/material';

import { APPROVAL_RULE } from '../lib/constants';

const CARDS = [
  {
    value: APPROVAL_RULE.PAUSE_AND_ASK,
    title: 'Pause and ask me',
    text: 'The run stops before the tool. You get a notice and approve or reject the step in Run History. If nobody answers in 24 hours, the run ends as Expired.',
  },
  {
    value: APPROVAL_RULE.RUN_WITHOUT_ASKING,
    title: 'Run without asking',
    text: 'The run uses these tools with no stop. Your admin allowed this option for this project. ELITEA records who confirmed it.',
  },
];

/**
 * The two approval rules as radio cards (owner CR 2026-10-21). `disabledNote` replaces the text of a
 * disabled "Run without asking"; `children` shows inside that card while it is selected.
 */
const ApprovalRuleCards = memo(props => {
  const { value, onChange, runWithoutAskingDisabled, disabledNote, children } = props;
  const id = useId();
  const styles = approvalRuleCardsStyles();

  return (
    <RadioGroup
      value={value}
      onChange={event => onChange(event.target.value)}
      sx={styles.group}
    >
      {CARDS.map(card => {
        const selected = card.value === value;
        const disabled = card.value === APPROVAL_RULE.RUN_WITHOUT_ASKING && runWithoutAskingDisabled;
        const titleId = `${id}-${card.value}`;
        return (
          <Box
            key={card.value}
            data-testid={`approval-rule-card-${card.value}`}
            sx={styles.card(selected, disabled)}
            onClick={disabled || selected ? undefined : () => onChange(card.value)}
          >
            <Radio
              value={card.value}
              disabled={disabled}
              autoFocus={selected}
              inputProps={{ 'aria-labelledby': titleId, 'aria-describedby': `${titleId}-text` }}
              sx={styles.radio}
            />
            <Box sx={styles.body}>
              <Box
                id={titleId}
                sx={styles.titleRow}
              >
                <Typography variant="labelMedium">{card.title}</Typography>
                {card.value === APPROVAL_RULE.PAUSE_AND_ASK && (
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    label="Default"
                  />
                )}
              </Box>
              <Typography
                id={`${titleId}-text`}
                variant="bodySmall"
                color="text.secondary"
                component="div"
              >
                {disabled ? disabledNote : card.text}
              </Typography>
              {selected && card.value === APPROVAL_RULE.RUN_WITHOUT_ASKING && children}
            </Box>
          </Box>
        );
      })}
    </RadioGroup>
  );
});

ApprovalRuleCards.displayName = 'ApprovalRuleCards';

/** @type {MuiSx} */
const approvalRuleCardsStyles = () => ({
  group: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card:
    (selected, disabled) =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5rem',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: `0.0625rem solid ${selected ? palette.primary.main : palette.border.lines}`,
      backgroundColor: selected ? alpha(palette.primary.main, 0.1) : 'transparent',
      cursor: disabled || selected ? 'default' : 'pointer',
      opacity: disabled ? 0.7 : 1,
    }),
  radio: { padding: 0, marginTop: '0.125rem' },
  body: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 },
  titleRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
});

export default ApprovalRuleCards;
