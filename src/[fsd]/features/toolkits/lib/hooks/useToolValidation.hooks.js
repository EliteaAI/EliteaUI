import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { parseValidationRefusal } from '@/[fsd]/features/chat/lib/helpers/refusal.helpers';
import * as ToolkitFormHelpers from '@/[fsd]/features/toolkits/lib/helpers/toolkitForm.helpers';
import { mapAssociationError } from '@/hooks/application/useAgentPipelineAssociation';
import { useToolValidationInfo } from '@/hooks/application/useValidateApplicationVersion';

const PRIVATE_CREDENTIAL_NOT_FOUND = 'private_credential_not_found';

/**
 * Validation state of one tool attached to an agent or pipeline version.
 * Reads the parent version's errors for the tool, or the sub-agent's own errors for an agent or pipeline tool.
 *
 * @returns {{
 *   validationInfo: unknown,
 *   governedRefusal: ReturnType<typeof parseValidationRefusal>,
 *   toolValidationMessage: unknown,
 *   errorType: string | undefined,
 *   isForeignPrivateCredential: boolean,
 * }}
 */
export const useToolValidation = ({ projectId, applicationId, versionId, tool } = {}) => {
  const toolId = tool?.id;
  const isApplication = tool?.type === 'application';
  const entityType = tool?.agent_type === 'pipeline' ? 'pipeline' : 'agent';

  const { personal_project_id: personalProjectId } = useSelector(state => state.user);
  const validationInfo = useToolValidationInfo({ projectId, applicationId, versionId, toolId, tool });

  // a credential refused by governance (#7281): its text and code, for a toolkit and for an agent that nests one
  const governedRefusal = useMemo(() => parseValidationRefusal(validationInfo), [validationInfo]);

  const toolValidationMessage = useMemo(() => {
    if (!validationInfo) return null;
    if (governedRefusal) return governedRefusal.message;

    // For agent/pipeline (application-type) tools the backend already tells us WHY the sub-agent is
    // invalid (circular reference, "uses other agents" / leaf-only, self-reference). `validationInfo`
    // carries that message — route it through the shared mapper (issue #5717) so the card shows the
    // same friendly, ID-free phrasing as the add/switch toasts instead of the vague generic line.
    // Fall back to the generic sentence only when there is no usable backend message.
    if (isApplication) {
      const rawMsg = typeof validationInfo === 'string' ? validationInfo : validationInfo?.message;
      return ToolkitFormHelpers.applicationToolValidationMessage(
        rawMsg,
        msg =>
          mapAssociationError(msg, tool?.name || entityType, {
            action: 'status',
            entityLabel: entityType,
          }),
        entityType,
      );
    }

    const parsedErrorMessage = ToolkitFormHelpers.parseValidationError(
      typeof validationInfo === 'object'
        ? validationInfo
        : {
            msg: validationInfo || '',
          },
    );
    return parsedErrorMessage?.message || validationInfo;
  }, [validationInfo, governedRefusal, isApplication, entityType, tool?.name]);

  const errorType = toolValidationMessage?.error_type;
  const isForeignPrivateCredential =
    errorType === PRIVATE_CREDENTIAL_NOT_FOUND && personalProjectId !== projectId;

  return {
    validationInfo,
    governedRefusal,
    toolValidationMessage,
    errorType,
    isForeignPrivateCredential,
  };
};
