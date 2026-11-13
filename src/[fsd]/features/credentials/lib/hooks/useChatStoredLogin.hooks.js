import { useCallback } from 'react';

import { useSelector } from 'react-redux';

import { StoredLoginHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useLazyGetConfigurationsByTypeQuery, useUpdateConfigurationMutation } from '@/api/configurations';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

// Enough to find any credential of one type in a project; the list has no uuid filter
const CREDENTIAL_LOOKUP_LIMIT = 500;

// After a chat sign-in, saves the Microsoft login on its credential so scheduled runs can use it
export const useChatStoredLogin = ({ toolkitType, resourceMetadata, tokenKey }) => {
  const { personal_project_id } = useSelector(state => state.user);
  const { toastSuccess, toastError, toastInfo } = useToast();
  const { checkPermission } = useCheckPermission();
  const selectedProjectId = useSelectedProjectId();
  const [getConfigurations] = useLazyGetConfigurationsByTypeQuery();
  const [updateConfiguration] = useUpdateConfigurationMutation();

  const config = StoredLoginHelpers.getChatStoredLoginConfig(toolkitType);
  const configurationUuid = resourceMetadata?.configuration_uuid;
  const credProjectId = resourceMetadata?.configuration_project_id;

  const isEnabled = Boolean(config && configurationUuid && credProjectId && tokenKey);

  // Never throws and reports every outcome with a toast: the chat run resumes whatever happens here
  const saveLogin = useCallback(async () => {
    if (!isEnabled) return;
    try {
      // Everyone runs on a team credential's login, so only admins may set it. The permissions known here
      // are those of the selected project; for a credential of another project the server decides.
      const isPrivate = credProjectId === personal_project_id;
      const canPrecheck = !isPrivate && String(credProjectId) === String(selectedProjectId);
      if (canPrecheck && !checkPermission(PERMISSIONS.users.edit)) {
        toastInfo(
          'Signed in for this chat. Ask a project admin to log in on the credential for scheduled runs.',
        );
        return;
      }
      const refreshToken = McpAuthHelpers.getRefreshToken(tokenKey);
      if (!refreshToken) {
        toastError('Microsoft did not return a refresh token, so scheduled runs cannot use this login.');
        return;
      }
      const response = await getConfigurations({
        projectId: credProjectId,
        type: config.configurationType,
        pageSize: CREDENTIAL_LOOKUP_LIMIT,
      }).unwrap();
      const credential = response?.items?.find(item => item.uuid === configurationUuid);
      if (!credential) {
        toastError('Could not find the credential to save the login on.');
        return;
      }
      const body = StoredLoginHelpers.buildStoredLoginBody(credential.data, refreshToken);
      await updateConfiguration({ projectId: credProjectId, configId: credential.id, body }).unwrap();
      toastSuccess('Connected! The login is saved for scheduled runs.');
    } catch (error) {
      toastError(error?.data?.error || 'Could not save the login to the credential.');
    }
  }, [
    isEnabled,
    config,
    configurationUuid,
    credProjectId,
    tokenKey,
    personal_project_id,
    selectedProjectId,
    checkPermission,
    getConfigurations,
    updateConfiguration,
    toastSuccess,
    toastError,
    toastInfo,
  ]);

  return { isEnabled, saveLogin };
};
