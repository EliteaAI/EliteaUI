import { useEffect, useMemo, useRef } from 'react';

import { useSelector } from 'react-redux';

import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { ApiProtocolConstants } from '../constants/index.js';
import { ApiProtocolHelpers } from '../helpers/index.js';
import { useCredentialsData } from './useCredentialsData.hooks.js';

const { API_PROTOCOL_CREDENTIAL_FIELD, API_PROTOCOL_FIELD } = ApiProtocolConstants;
const { credentialKeyOf, findCredentialType, isApiProtocolCredentialType, resolveApiProtocolForModel } =
  ApiProtocolHelpers;

const CREDENTIALS_SECTION = 'ai_credentials';
const noop = () => {};

// Hides api_protocol unless the credential supports it, and auto-suggests it from the model name.
export const useApiProtocolField = ({ schema, settings, editField }) => {
  const selectedProjectId = useSelectedProjectId();
  const { personal_project_id } = useSelector(state => state.user);

  const hasField = !!schema?.properties?.[API_PROTOCOL_FIELD];
  const credentialValue = settings?.[API_PROTOCOL_CREDENTIAL_FIELD];

  const { configurations, hasFetchedData } = useCredentialsData({
    // only fetch while the field can actually be shown for this schema
    selectedProjectId: hasField ? selectedProjectId : undefined,
    personal_project_id: hasField ? personal_project_id : undefined,
    section: CREDENTIALS_SECTION,
    batchValidateCredentials: noop,
    resetStatuses: noop,
  });

  const isSupported = useMemo(() => {
    // configurations is still empty pre-fetch — don't flash the field visible then hide it
    if (!hasFetchedData) return true;
    const eliteaTitle = credentialValue?.elitea_title;
    const resolvedType = findCredentialType(configurations, credentialValue, personal_project_id);
    // a credential is being picked/just created and not resolvable yet — don't assume it's unsupported
    if (eliteaTitle && !resolvedType) return true;
    return isApiProtocolCredentialType(resolvedType);
  }, [hasFetchedData, configurations, credentialValue, personal_project_id]);

  const isHidden = hasField && !isSupported;

  const schemaDefault = schema?.properties?.[API_PROTOCOL_FIELD]?.default;
  const rawProtocol = settings?.[API_PROTOCOL_FIELD];
  const modelName = settings?.name;
  const credentialKey = credentialKeyOf(credentialValue);
  // guards against re-suggesting for a name we already answered, editField being async
  const autoSelectedForRef = useRef(null);
  const autoSelectedValueRef = useRef(null);
  const lastCredentialKeyRef = useRef(null);
  // the loaded state of a saved model is not a user edit, so record name and credential together
  // before reacting to either: seeding only the name would let the credential effect undo it
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (hasSeededRef.current || modelName === undefined) return;
    hasSeededRef.current = true;
    autoSelectedForRef.current = modelName;
    lastCredentialKeyRef.current = credentialKey;
  }, [modelName, credentialKey]);

  useEffect(() => {
    if (!hasSeededRef.current || lastCredentialKeyRef.current === credentialKey) return;
    lastCredentialKeyRef.current = credentialKey;
    // a new credential may now support/need a different protocol — allow re-suggesting for it
    autoSelectedForRef.current = null;
    // and never carry a protocol picked for the previous credential into the payload
    if (isHidden && rawProtocol !== undefined) {
      editField?.(`settings.${API_PROTOCOL_FIELD}`, undefined);
    }
  }, [credentialKey, isHidden, rawProtocol, editField]);

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
