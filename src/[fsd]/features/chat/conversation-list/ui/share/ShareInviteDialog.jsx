import { memo, useCallback, useMemo } from 'react';

import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useRoleListQuery, useUserCreateMutation } from '@/api/admin';
import { buildErrorMessage } from '@/common/utils';
import InviteUserDialog from '@/components/InviteUserDialog';

const ShareInviteDialog = memo(props => {
  const { onClose } = props;

  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError } = useToast();

  const { data: roles = [] } = useRoleListQuery({ projectId, page: 0 }, { skip: !projectId });
  const rolesOptions = useMemo(() => roles.map(({ name }) => ({ label: name, value: name })), [roles]);
  const [inviteUsers] = useUserCreateMutation();

  const handleConfirm = useCallback(
    async ({ emails, roles: selectedRoles }) => {
      onClose();
      try {
        await inviteUsers({ projectId, emails, roles: selectedRoles }).unwrap();
        toastSuccess(emails.length > 1 ? 'The users have been invited' : 'The user has been invited');
      } catch (error) {
        toastError(buildErrorMessage(error));
      }
    },
    [inviteUsers, onClose, projectId, toastError, toastSuccess],
  );

  return (
    <InviteUserDialog
      title="Invite users"
      open
      onClose={onClose}
      onCancel={onClose}
      onConfirm={handleConfirm}
      rolesOptions={rolesOptions}
      emailsInputTestId="share-invite-emails-input"
      roleSelectTestId="share-invite-role-select"
      confirmButtonTestId="share-invite-confirm-button"
      emailsErrorTestId="share-invite-emails-error-text"
    />
  );
});

ShareInviteDialog.displayName = 'ShareInviteDialog';

export default ShareInviteDialog;
