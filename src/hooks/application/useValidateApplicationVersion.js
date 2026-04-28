import { useCallback, useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch, useSelector } from 'react-redux';

import {
  useLazyGetApplicationVersionDetailQuery,
  useLazyValidateApplicationVersionQuery,
  useValidateApplicationVersionQuery,
} from '@/api/applications';
import { buildErrorMessage } from '@/common/utils';
import useToast from '@/hooks/useToast';
import { actions } from '@/slices/applications';

const buildValidationKey = (projectId, applicationId, versionId) =>
  `${projectId}_${applicationId}_${versionId}`;

const getSubAgentValidationKey = (projectId, tool) => {
  if (
    tool?.type !== 'application' ||
    !tool?.settings?.application_id ||
    !tool?.settings?.application_version_id
  ) {
    return null;
  }
  return buildValidationKey(projectId, tool.settings.application_id, tool.settings.application_version_id);
};

const extractValidationInfo = ({ error, toastError, dispatch, applicationId, projectId, versionId }) => {
  if (error?.status && error.status !== 400) {
    toastError(buildErrorMessage(error));
  }
  dispatch(
    actions.setVersionValidationInfo({
      applicationId,
      projectId,
      versionId,
      validationInfo: error?.data?.toolkit_errors || [],
    }),
  );
};

export default function useValidateApplicationVersion({
  applicationId,
  projectId,
  versionId,
  forceSkip,
} = {}) {
  const dispatch = useDispatch();
  const { toastError } = useToast();
  const skipQuery = !applicationId || !projectId || !versionId || forceSkip;

  const { error, isError } = useValidateApplicationVersionQuery(
    {
      applicationId,
      projectId,
      versionId,
    },
    { skip: skipQuery, refetchOnMountOrArgChange: true },
  );

  useEffect(() => {
    if (isError) {
      extractValidationInfo({ error, toastError, dispatch, applicationId, projectId, versionId });
    }
  }, [isError, error, toastError, dispatch, applicationId, projectId, versionId]);
}

export const useManualValidateApplicationVersion = ({
  applicationId,
  projectId,
  versionId,
  tools,
  toolId,
  needValidateTheWholeAgent = true,
} = {}) => {
  const dispatch = useDispatch();
  const { toastError } = useToast();
  const { setFieldValue } = useFormikContext();
  const [validateAppVersion] = useLazyValidateApplicationVersionQuery();
  const [fetchVersionDetail] = useLazyGetApplicationVersionDetailQuery();

  const subApplication = useMemo(() => {
    if (!tools?.length) return undefined;
    return tools.find(
      tool =>
        tool.type === 'application' &&
        tool.id === toolId &&
        tool.settings?.application_id &&
        tool.settings?.application_version_id,
    );
  }, [tools, toolId]);

  const doValidateVersion = useCallback(async () => {
    try {
      const result = await validateAppVersion({
        applicationId,
        projectId,
        versionId,
      }).unwrap();
      extractValidationInfo({
        error: result.error,
        toastError,
        dispatch,
        applicationId,
        projectId,
        versionId,
      });
    } catch (error) {
      extractValidationInfo({
        error,
        toastError,
        dispatch,
        applicationId,
        projectId,
        versionId,
      });
    }
    if (subApplication) {
      try {
        const result = await validateAppVersion({
          projectId,
          applicationId: subApplication.settings.application_id,
          versionId: subApplication.settings.application_version_id,
        }).unwrap();
        extractValidationInfo({
          error: result.error,
          toastError,
          dispatch,
          projectId,
          applicationId: subApplication.settings.application_id,
          versionId: subApplication.settings.application_version_id,
        });
      } catch (error) {
        extractValidationInfo({
          error,
          toastError,
          dispatch,
          projectId,
          applicationId: subApplication.settings.application_id,
          versionId: subApplication.settings.application_version_id,
        });
      }
    }
    if (needValidateTheWholeAgent) {
      const details = await fetchVersionDetail({
        projectId,
        applicationId,
        versionId,
      }).unwrap();
      setFieldValue('version_details.tools', details.tools || []);
    }
  }, [
    subApplication,
    needValidateTheWholeAgent,
    validateAppVersion,
    applicationId,
    projectId,
    versionId,
    toastError,
    dispatch,
    fetchVersionDetail,
    setFieldValue,
  ]);
  return { doValidateVersion };
};

export function useToolsValidationInfo({ applicationId, projectId, versionId, tools }) {
  const selectorKey = useMemo(
    () => buildValidationKey(projectId, applicationId, versionId),
    [projectId, applicationId, versionId],
  );
  const versionValidationInfo = useSelector(state => state.applications.versionValidationInfo);
  const toolsValidationInfo = useMemo(() => {
    if (!applicationId || !projectId || !versionId || !tools?.length) {
      return {};
    }
    const info = (versionValidationInfo[selectorKey] || []).reduce((acc, validationInfo) => {
      const id = validationInfo.loc?.[1];
      const foundTool = tools.find(tool => tool.id === id);
      if (id !== undefined && foundTool) {
        acc[id] = validationInfo.msg;
      }
      return acc;
    }, {});

    // Also check sub-agent tools for their own validation errors
    tools.forEach(tool => {
      if (!info[tool.id]) {
        const subKey = getSubAgentValidationKey(projectId, tool);
        if (subKey) {
          const subErrors = versionValidationInfo[subKey];
          if (Array.isArray(subErrors) && subErrors.length > 0) {
            info[tool.id] = subErrors.map(e => e.msg).join('; ');
          }
        }
      }
    });

    return info;
  }, [applicationId, projectId, selectorKey, tools, versionId, versionValidationInfo]);
  const totalValidationInfo = useMemo(() => Object.values(toolsValidationInfo), [toolsValidationInfo]);
  return { toolsValidationInfo, totalValidationInfo };
}

/**
 * Attempts to parse a structured error from a pydantic-formatted validation message.
 * The backend encodes private-credential-not-found errors as JSON in the message:
 *   "Value error, {\"error_type\": \"private_credential_not_found\", ...}"
 * Returns the parsed object when recognised, otherwise returns the original string.
 */
const parseValidationMsg = msg => {
  if (!msg) return msg;
  const VALUE_ERROR_PREFIX = 'Value error, ';
  const body = msg.startsWith(VALUE_ERROR_PREFIX) ? msg.slice(VALUE_ERROR_PREFIX.length) : msg;
  try {
    const parsed = JSON.parse(body);
    if (parsed && parsed.error_type) return parsed;
  } catch {
    // not JSON – return original string
  }
  return msg;
};

export function useToolValidationInfo({ applicationId, projectId, versionId, toolId, tool } = {}) {
  const selectorKey = useMemo(
    () => buildValidationKey(projectId, applicationId, versionId),
    [projectId, applicationId, versionId],
  );

  const subAgentKey = useMemo(() => getSubAgentValidationKey(projectId, tool), [projectId, tool]);

  const versionValidationInfo = useSelector(state => state.applications.versionValidationInfo);

  const toolValidationInfo = useMemo(() => {
    // Check parent agent's validation errors for this tool
    const parentError = (versionValidationInfo[selectorKey] || []).find(info => info.loc?.[1] === toolId);
    if (parentError?.msg) return parseValidationMsg(parentError.msg);

    // For application-type tools, also check the sub-agent's own validation errors
    if (subAgentKey) {
      const subErrors = versionValidationInfo[subAgentKey];
      if (Array.isArray(subErrors) && subErrors.length > 0) {
        return subErrors.map(e => e.msg).join('; ');
      }
    }

    return '';
  }, [versionValidationInfo, selectorKey, toolId, subAgentKey]);

  return toolValidationInfo;
}
