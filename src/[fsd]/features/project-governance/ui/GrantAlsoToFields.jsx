import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useUserListQuery } from '@/api/admin';

const MEMBERS_PAGE = 100;
const ROLE_OPTIONS = [
  { label: 'Nobody else', value: '' },
  { label: 'Every editor', value: 'editor' },
  { label: 'Every viewer', value: 'viewer' },
  { label: 'Every admin', value: 'admin' },
];

// "Also grant to" of a grant's approval (C-1009, #7269): the same use for other members, or for every member of a
// project role, approved with this one in one change (each filed under the request being approved). Nobody grants a
// use to themselves: the approver is never offered, and a role leaves them out (the server refuses it as well)
const GrantAlsoToFields = memo(props => {
  const { members, onMembersChange, role, onRoleChange, excludeUserIds } = props;
  const projectId = useSelectedProjectId();
  const styles = grantAlsoToFieldsStyles();

  const { data } = useUserListQuery(
    { projectId, page: 0, pageSize: MEMBERS_PAGE, params: {} },
    { skip: !projectId },
  );
  const options = useMemo(
    () =>
      (data?.rows ?? [])
        .filter(user => !(excludeUserIds || []).includes(user.id))
        .map(user => ({ label: user.email || user.name || `User ${user.id}`, value: user.id })),
    [data?.rows, excludeUserIds],
  );
  const handleMembers = useCallback(event => onMembersChange(event.target.value || []), [onMembersChange]);
  const handleRole = useCallback(event => onRoleChange(event.target.value || ''), [onRoleChange]);

  return (
    <Box
      sx={styles.root}
      data-testid="governance-also-grant"
    >
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Also grant to (optional)
      </Typography>
      <SingleSelect
        data-testid="governance-also-grant-members"
        showBorder
        multiple
        label="Members"
        value={members}
        onChange={handleMembers}
        options={options}
        showOptionIcon={false}
      />
      <SingleSelect
        data-testid="governance-also-grant-role"
        showBorder
        label="Project role"
        value={role}
        onChange={handleRole}
        options={ROLE_OPTIONS}
        showOptionIcon={false}
      />
    </Box>
  );
});

GrantAlsoToFields.displayName = 'GrantAlsoToFields';

/** @type {MuiSx} */
const grantAlsoToFieldsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
});

export default GrantAlsoToFields;
