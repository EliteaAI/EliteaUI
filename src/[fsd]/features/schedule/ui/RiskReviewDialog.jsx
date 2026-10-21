import { memo, useCallback, useEffect, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, CircularProgress, Link, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import RouteDefinitions from '@/routes';

import { APPROVAL_RULE, DEFAULT_APPROVAL_RULE } from '../lib/constants';
import ApprovalRuleCards from './ApprovalRuleCards';
import RiskToolCard from './RiskToolCard';

const NAME_LABEL_ID = 'risk-review-name-label';

/**
 * "Review risks before scheduling", opened on Save when the check finds sensitive tools (owner CR 2026-10-21).
 * `onConfirm({ rule, confirmedName })` saves; confirmedName comes only with "Run without asking".
 * `changed` shows the banner of a 409 risk_changed; `saving` disables both buttons.
 */
const RiskReviewDialog = memo(props => {
  const {
    open,
    entityLabel,
    scheduleName,
    tools = [],
    runWithoutAskingAllowed,
    scanIncomplete,
    showSettingsLink,
    changed,
    saving,
    onCancel,
    onConfirm,
  } = props;
  const [rule, setRule] = useState(DEFAULT_APPROVAL_RULE);
  const [typedName, setTypedName] = useState('');
  const [typed, setTyped] = useState(false);
  const styles = riskReviewDialogStyles();

  // Every opening starts at the default rule with an empty name
  useEffect(() => {
    if (!open) return;
    setRule(DEFAULT_APPROVAL_RULE);
    setTypedName('');
    setTyped(false);
  }, [open]);

  const runWithoutAsking = rule === APPROVAL_RULE.RUN_WITHOUT_ASKING;
  const nameMatches = typedName.trim() === scheduleName?.trim();
  const canConfirm = !saving && (!runWithoutAsking || nameMatches);

  const handleNameChange = useCallback(event => {
    setTypedName(event.target.value);
    setTyped(true);
  }, []);

  const handleConfirm = useCallback(
    () => onConfirm(runWithoutAsking ? { rule, confirmedName: scheduleName } : { rule }),
    [onConfirm, rule, runWithoutAsking, scheduleName],
  );

  const handleCancel = useCallback(() => {
    if (!saving) onCancel();
  }, [onCancel, saving]);

  const disabledNote = scanIncomplete ? (
    'ELITEA could not list all tools of this schedule, so it can only pause and ask.'
  ) : (
    <>
      This project does not allow running without asking.
      {showSettingsLink && (
        <>
          {' '}
          <Link
            component={RouterLink}
            to={RouteDefinitions.SettingsProjectGeneral}
          >
            Open Project General
          </Link>
        </>
      )}
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      title="Review risks before scheduling"
      titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
      onClose={handleCancel}
      sx={styles.modal}
      content={
        <Box sx={styles.content}>
          {changed && (
            <BannerMessage variant="info">
              <Typography
                variant="bodySmall"
                sx={styles.text}
              >
                The tools changed. Review them again.
              </Typography>
            </BannerMessage>
          )}
          <Typography variant="bodyMedium">
            Nobody watches a scheduled run.{' '}
            <Box
              component="strong"
              sx={styles.strong}
            >
              {entityLabel}
            </Box>{' '}
            can use these sensitive tools:
          </Typography>
          <Box sx={styles.tools}>
            {tools.map(tool => (
              <RiskToolCard
                key={`${tool.toolkit}-${tool.tool}`}
                tool={tool}
              />
            ))}
          </Box>
          <Typography variant="labelMedium">
            What should a scheduled run do before it uses these tools?
          </Typography>
          <ApprovalRuleCards
            value={rule}
            onChange={setRule}
            runWithoutAskingDisabled={!runWithoutAskingAllowed || scanIncomplete}
            disabledNote={disabledNote}
          >
            <Box sx={styles.confirm}>
              <BannerMessage variant="warning">
                <Typography
                  variant="bodySmall"
                  sx={styles.text}
                >
                  You are responsible for what these tools do. If the agent gets new sensitive tools, the
                  schedule goes back to &apos;Pause and ask me&apos;.
                </Typography>
              </BannerMessage>
              <Typography
                id={NAME_LABEL_ID}
                variant="bodySmall"
                sx={styles.text}
              >
                Type the schedule name to confirm:{' '}
                <Box
                  component="strong"
                  sx={styles.strong}
                >
                  {scheduleName}
                </Box>
              </Typography>
              <StyledInputEnhancer
                value={typedName}
                onChange={handleNameChange}
                showCopyAction={false}
                showFullScreenAction={false}
                showExpandAction={false}
                inputProps={{ 'aria-labelledby': NAME_LABEL_ID, 'data-testid': 'risk-review-name-input' }}
              />
              {typed && !nameMatches && (
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                >
                  The name does not match yet.
                </Typography>
              )}
            </Box>
          </ApprovalRuleCards>
        </Box>
      }
      actions={
        <>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            disabled={saving}
            onClick={handleCancel}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            disabled={!canConfirm}
            onClick={handleConfirm}
            startIcon={saving ? <CircularProgress size="1rem" /> : undefined}
          >
            Confirm
          </Button.BaseBtn>
        </>
      }
    />
  );
});

RiskReviewDialog.displayName = 'RiskReviewDialog';

/** @type {MuiSx} */
const riskReviewDialogStyles = () => ({
  modal: { width: '43.75rem', maxWidth: 'calc(100% - 2rem)', padding: '0.75rem' },
  content: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  // After 4 cards the list scrolls inside the dialog and the footer stays visible
  tools: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '20rem', overflowY: 'auto' },
  text: ({ palette }) => ({ color: palette.text.primary }),
  strong: { fontWeight: 600 },
  confirm: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' },
});

export default RiskReviewDialog;
