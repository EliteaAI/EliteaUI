import { useEffect, useMemo, useRef } from 'react';

import { useSelector } from 'react-redux';

import { useGetConfigurationsListQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { API_PROTOCOL_CREDENTIAL_FIELD, API_PROTOCOL_FIELD } from '../constants/apiProtocol.constants.js';
import {
  findCredentialType,
  isApiProtocolCredentialType,
  resolveApiProtocolForModel,
} from '../helpers/apiProtocol.helpers.js';

const CREDENTIALS_SECTION = 'ai_credentials';
const PAGE_SIZE = 500;

const listArgs = projectId => ({
  projectId,
  page: 0,
  pageSize: PAGE_SIZE,
  sharedOffset: 0,
  sharedLimit: PAGE_SIZE,
  includeShared: true,
  section: CREDENTIALS_SECTION,
});

/**
 * Keeps the api_protocol selector out of the form unless the picked AI credential is a
 * multi-protocol one, and pre-selects the protocol implied by the model name while the
 * field is still untouched.
 */
export const useApiProtocolField = ({ schema, settings, editField }) => {
  const selectedProjectId = useSelectedProjectId();
  const { personal_project_id } = useSelector(state => state.user);

  const hasField = !!schema?.properties?.[API_PROTOCOL_FIELD];
  const credentialValue = settings?.[API_PROTOCOL_CREDENTIAL_FIELD];

  const { data: projectData } = useGetConfigurationsListQuery(listArgs(selectedProjectId), {
    skip: !hasField || !selectedProjectId,
  });
  const { data: personalData } = useGetConfigurationsListQuery(listArgs(personal_project_id), {
    skip: !hasField || !personal_project_id || personal_project_id === selectedProjectId,
  });

  const configurations = useMemo(
    () => [
      ...(projectData?.items || []),
      ...(projectData?.shared?.items || []),
      ...(personalData?.items || []),
    ],
    [projectData, personalData],
  );

  const isSupported = useMemo(
    () => isApiProtocolCredentialType(findCredentialType(configurations, credentialValue)),
    [configurations, credentialValue],
  );

  const isHidden = hasField && !isSupported;

  const schemaDefault = schema?.properties?.[API_PROTOCOL_FIELD]?.default;
  const rawProtocol = settings?.[API_PROTOCOL_FIELD];
  const modelName = settings?.name;
  // guards against re-suggesting for a name we already answered, editField being async
  const autoSelectedForRef = useRef(null);
  const autoSelectedValueRef = useRef(null);

  // the form seeds the schema default, and our own suggestion is not a user choice either
  const isUserPicked =
    !!rawProtocol && rawProtocol !== schemaDefault && rawProtocol !== autoSelectedValueRef.current;

  useEffect(() => {
    if (isHidden || !hasField || isUserPicked || autoSelectedForRef.current === modelName) return;
    const suggested = resolveApiProtocolForModel(modelName);
    if (!suggested) return;
    autoSelectedForRef.current = modelName;
    autoSelectedValueRef.current = suggested;
    editField?.(`settings.${API_PROTOCOL_FIELD}`, suggested);
  }, [isHidden, hasField, isUserPicked, modelName, editField]);

  return { isApiProtocolHidden: isHidden };
};
