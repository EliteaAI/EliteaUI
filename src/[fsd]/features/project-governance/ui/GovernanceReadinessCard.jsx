import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import {
  useGetGovernanceReadinessQuery,
  useRequestGovernedSetupMutation,
} from '@/[fsd]/features/project-governance/api/projectGovernanceApi';
import * as GovernanceHelpers from '@/[fsd]/features/project-governance/lib/helpers/projectGovernance.helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import ReadinessValueFields from './ReadinessValueFields';

// The Save card (C-1009, #7269): what an agent or pipeline version, a toolkit or a schedule still needs to run
// governed for you, read after a save and whenever you open it, with one Request for everything you may request (one
// batch for the project's admins). Shared parts (identity, registration, mandate) show once; your own grant and consent
// show for you. Nothing shows while governance is not enforced (the list is empty) or when nothing is missing.
const GovernanceReadinessCard = memo(props => {
  const { entityKind, entityId, testId = 'governance-readiness', sx } = props;
  const styles = governanceReadinessCardStyles();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const [wasNeeded, setWasNeeded] = useState(false);
  const [writing, setWriting] = useState(null); // the key of the row whose value is being written
  const seenFor = useRef(null);

  const { data, isFetching } = useGetGovernanceReadinessQuery(
    { projectId, entityKind, entityId },
    { skip: !projectId || !entityId, refetchOnMountOrArgChange: true },
  );
  const [requestSetup, { isLoading: isRequesting }] = useRequestGovernedSetupMutation();

  const items = data?.items ?? [];
  const keys = GovernanceHelpers.requestableKeys(items);
  const entityKey = `${projectId}:${entityKind}:${entityId}`;

  useEffect(() => {
    if (seenFor.current !== entityKey) {
      seenFor.current = entityKey;
      setWasNeeded(false);
    }
    if (items.length) setWasNeeded(true);
  }, [entityKey, items.length]);

  const handleRequest = useCallback(async () => {
    try {
      const result = await requestSetup({ projectId, entityKind, entityId, keys }).unwrap();
      toastSuccess(`Requested ${result?.filed?.length ?? keys.length}: a project admin approves it.`);
    } catch (err) {
      const refusal = GovernanceHelpers.toGovernanceError(err, 'The request failed.');
      toastError(refusal.code ? `${refusal.message} (${refusal.code})` : refusal.message);
    }
  }, [entityId, entityKind, keys, projectId, requestSetup, toastError, toastSuccess]);

  if (!items.length) {
    return wasNeeded && !isFetching ? (
      <Box
        sx={[styles.root, sx]}
        data-testid={`${testId}-ready`}
      >
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          Approved: everything this needs to run governed is in place.
        </Typography>
      </Box>
    ) : null;
  }

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid={testId}
    >
      <Typography
        variant="labelMedium"
        color="text.secondary"
      >
        To run under governance this still needs
      </Typography>
      {items.map(item => (
        <Box
          key={item.key}
          sx={styles.item}
        >
          <Box
            sx={styles.row}
            data-testid={`${testId}-item`}
          >
            <Typography
              variant="bodySmall"
              sx={styles.title}
            >
              {item.title}
            </Typography>
            <Typography
              variant="bodySmall"
              color="text.secondary"
              sx={styles.text}
            >
              {GovernanceHelpers.readinessText(item)}
              {item.for === 'me' ? ' (for you)' : ''}
            </Typography>
            <Typography
              variant="bodySmall2"
              color={item.escalated ? 'warning.main' : 'text.secondary'}
              data-testid={`${testId}-status-${item.key}`}
            >
              {GovernanceHelpers.readinessStatus(item)}
            </Typography>
            {GovernanceHelpers.isValueItem(item) && (
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                size="small"
                onClick={() => setWriting(writing === item.key ? null : item.key)}
                data-testid={`${testId}-write-${item.key}`}
              >
                {writing === item.key ? 'Cancel' : 'Write value'}
              </Button.BaseBtn>
            )}
          </Box>
          {writing === item.key && GovernanceHelpers.isValueItem(item) && (
            <ReadinessValueFields
              item={item}
              testId={`${testId}-value`}
              onDone={() => {
                setWriting(null);
                toastSuccess('Stored: a project admin checks and approves it.');
              }}
            />
          )}
        </Box>
      ))}
      {keys.length > 0 && (
        <Box sx={styles.actions}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            size="small"
            onClick={handleRequest}
            disabled={isRequesting}
            data-testid={`${testId}-request`}
          >
            Request
            {isRequesting && (
              <CircularProgress
                size={12}
                sx={styles.progress}
              />
            )}
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

GovernanceReadinessCard.displayName = 'GovernanceReadinessCard';

/** @type {MuiSx} */
const governanceReadinessCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(8rem, 1fr) 2fr auto auto',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
  },
  title: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  text: {
    minWidth: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  progress: {
    ml: '0.25rem',
  },
});

export default GovernanceReadinessCard;
