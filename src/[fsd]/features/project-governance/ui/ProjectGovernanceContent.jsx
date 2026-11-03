import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import {
  useGetProjectBindingsQuery,
  useGetProjectGrantsQuery,
  useGetProjectMandatesQuery,
  useGetProjectReferencesQuery,
  useProjectBindingActionMutation,
  useProjectGrantActionMutation,
  useProjectMandateActionMutation,
  useProjectReferenceActionMutation,
} from '@/[fsd]/features/project-governance/api/projectGovernanceApi';
import * as GovernanceHelpers from '@/[fsd]/features/project-governance/lib/helpers/projectGovernance.helpers';
import { DrawerPageBody, DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Tab } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import GovernanceApproveDialog from './GovernanceApproveDialog';
import GovernanceRowsTable from './GovernanceRowsTable';

const { KINDS } = GovernanceHelpers;
const G = PERMISSIONS.governance;
const TABS = [
  { value: 'inbox', label: 'Inbox' },
  { value: KINDS.binding, label: 'Agent identities', permission: G.bindingsView },
  { value: KINDS.reference, label: 'Credentials', permission: G.credentialsView },
  { value: KINDS.grant, label: 'Grants', permission: G.credentialsView },
  { value: KINDS.mandate, label: 'Mandates', permission: G.mandatesView },
];
const EMPTY = {
  inbox: 'Nothing is waiting for an approval in this project.',
  [KINDS.binding]: 'No agent identities in this project yet.',
  [KINDS.reference]: 'No governed credentials in this project yet.',
  [KINDS.grant]: 'No grants in this project yet.',
  [KINDS.mandate]: 'No mandates in this project yet.',
};
const STALE_TEXT = 'It changed in the meantime; the list was read again.';

// The project operator view and inbox (C-1009, #7269): the project's own admins approve and operate the agent
// identities, credentials, grants and mandates of their project here, as a platform operator does in the Admin UI.
// Items nobody in the project can approve are marked "Needs a platform operator". Owners' consents stay where they
// are (#7337).
const ProjectGovernanceContent = memo(() => {
  const styles = projectGovernanceContentStyles();
  const projectId = useSelectedProjectId();
  const userId = useSelector(state => state.user?.id);
  const { checkPermission } = useCheckPermission();
  const { toastError, toastInfo, toastSuccess } = useToast();
  const [tab, setTab] = useState('inbox');
  const [approving, setApproving] = useState(null);

  const tabs = useMemo(
    () => TABS.filter(item => !item.permission || checkPermission(item.permission)),
    [checkPermission],
  );
  const queryOptions = permission => ({
    skip: !projectId || !checkPermission(permission),
    refetchOnMountOrArgChange: true,
  });
  const bindings = useGetProjectBindingsQuery({ projectId }, queryOptions(G.bindingsView));
  const references = useGetProjectReferencesQuery({ projectId }, queryOptions(G.credentialsView));
  const grants = useGetProjectGrantsQuery({ projectId }, queryOptions(G.credentialsView));
  const mandates = useGetProjectMandatesQuery({ projectId }, queryOptions(G.mandatesView));

  const [bindingAction, bindingState] = useProjectBindingActionMutation();
  const [referenceAction, referenceState] = useProjectReferenceActionMutation();
  const [grantAction, grantState] = useProjectGrantActionMutation();
  const [mandateAction, mandateState] = useProjectMandateActionMutation();
  const isBusy =
    bindingState.isLoading || referenceState.isLoading || grantState.isLoading || mandateState.isLoading;

  const lists = useMemo(
    () => ({
      [KINDS.binding]: bindings.data?.rows ?? [],
      [KINDS.reference]: references.data?.rows ?? [],
      [KINDS.grant]: grants.data?.rows ?? [],
      [KINDS.mandate]: mandates.data?.rows ?? [],
    }),
    [bindings.data, grants.data, mandates.data, references.data],
  );
  const isLoading = bindings.isLoading || references.isLoading || grants.isLoading || mandates.isLoading;
  const failed = [bindings, references, grants, mandates].find(query => query.isError);

  const items = useMemo(
    () =>
      tab === 'inbox'
        ? GovernanceHelpers.inboxItems(lists)
        : (lists[tab] ?? []).map(row => ({ kind: tab, row })),
    [lists, tab],
  );

  const send = useCallback(
    (kind, row, body) => {
      const id = { projectId };
      if (kind === KINDS.binding) return bindingAction({ ...id, bindingId: row.id, ...body }).unwrap();
      if (kind === KINDS.reference) return referenceAction({ ...id, referenceId: row.id, ...body }).unwrap();
      if (kind === KINDS.grant) return grantAction({ ...id, grantId: row.id, ...body }).unwrap();
      return mandateAction({ ...id, mandateId: row.id, ...body }).unwrap();
    },
    [bindingAction, grantAction, mandateAction, projectId, referenceAction],
  );

  const handleRun = useCallback(
    async (kind, row, item) => {
      try {
        await send(kind, row, GovernanceHelpers.actionBody(kind, row, item.action));
        toastSuccess(`${GovernanceHelpers.rowTitle(kind, row)}: done.`);
      } catch (err) {
        const refusal = GovernanceHelpers.toGovernanceError(err);
        if (GovernanceHelpers.STALE_CODES.includes(refusal.code)) toastInfo(STALE_TEXT);
        else toastError(refusal.code ? `${refusal.message} (${refusal.code})` : refusal.message);
      }
    },
    [send, toastError, toastInfo, toastSuccess],
  );

  const handleApprove = useCallback((kind, row, item) => setApproving({ kind, row, item }), []);
  const handleApproveClose = useCallback(() => setApproving(null), []);
  const handleApproveSubmit = useCallback(
    approval =>
      send(
        approving.kind,
        approving.row,
        GovernanceHelpers.actionBody(approving.kind, approving.row, approving.item.action, approval),
      ),
    [approving, send],
  );
  const handleApproveDone = useCallback(
    outcome => {
      const title = approving ? GovernanceHelpers.rowTitle(approving.kind, approving.row) : '';
      setApproving(null);
      if (outcome === 'stale') toastInfo(STALE_TEXT);
      else toastSuccess(`${title}: approved.`);
    },
    [approving, toastInfo, toastSuccess],
  );

  return (
    <>
      <DrawerPageHeader
        title="Governance"
        titleTestId="project-governance-title"
        extraContent={
          <Tab.TabGroupButton
            arrayBtn={tabs}
            value={tab}
            onChange={(_event, value) => value && setTab(value)}
            disableTooltip
            data-testid="project-governance-tabs"
          />
        }
      />
      <DrawerPageBody>
        <Box
          sx={styles.body}
          data-testid="project-governance"
        >
          {failed ? (
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              data-testid="project-governance-error"
            >
              {GovernanceHelpers.toGovernanceError(failed.error, 'Governance could not be read.').message}
            </Typography>
          ) : (
            <GovernanceRowsTable
              items={items}
              showKind={tab === 'inbox'}
              isLoading={isLoading}
              emptyMessage={EMPTY[tab]}
              userId={userId}
              checkPermission={checkPermission}
              onRun={handleRun}
              onApprove={handleApprove}
              isBusy={isBusy}
            />
          )}
        </Box>
      </DrawerPageBody>
      <GovernanceApproveDialog
        open={Boolean(approving)}
        title={approving ? `Approve ${GovernanceHelpers.rowTitle(approving.kind, approving.row)}` : ''}
        description="Recorded with the approval. Another admin of the project asked for it; you cannot approve your own."
        onSubmit={handleApproveSubmit}
        onClose={handleApproveClose}
        onDone={handleApproveDone}
      />
    </>
  );
});

ProjectGovernanceContent.displayName = 'ProjectGovernanceContent';

/** @type {MuiSx} */
const projectGovernanceContentStyles = () => ({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    height: '100%',
    width: '100%',
  },
});

export default ProjectGovernanceContent;
