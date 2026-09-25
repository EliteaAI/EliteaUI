import { useEffect, useMemo, useRef } from 'react';

import { useSelector } from 'react-redux';

import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { LLM_MODEL_CREDENTIALS_SECTION } from '../constants/llmModelForm.constants.js';
import { credentialKeyOf, findCredentialType } from '../helpers/apiProtocol.helpers.js';
import { useCredentialsData } from './useCredentialsData.hooks.js';

const noop = () => {};

export const useLlmModelCredentialType = credentialValue => {
  const selectedProjectId = useSelectedProjectId();
  const { personal_project_id } = useSelector(state => state.user);
  const { configurations, hasFetchedData, isFetching, onRefresh } = useCredentialsData({
    selectedProjectId,
    personal_project_id,
    section: LLM_MODEL_CREDENTIALS_SECTION,
    batchValidateCredentials: noop,
    resetStatuses: noop,
  });
  const credentialType = useMemo(
    () => findCredentialType(configurations, credentialValue, personal_project_id),
    [configurations, credentialValue, personal_project_id],
  );

  const credentialKey = credentialKeyOf(credentialValue);
  const refreshedCredentialKeyRef = useRef('');
  const isCredentialListSettled = hasFetchedData && !isFetching;
  const isCredentialUnresolved = Boolean(credentialValue?.elitea_title) && !credentialType;
  const isCredentialMissingFromList = isCredentialListSettled && isCredentialUnresolved;
  useEffect(() => {
    if (!isCredentialMissingFromList || refreshedCredentialKeyRef.current === credentialKey) return;
    refreshedCredentialKeyRef.current = credentialKey;
    onRefresh();
  }, [isCredentialMissingFromList, credentialKey, onRefresh]);

  return {
    credentialType,
    isCredentialTypePending: isCredentialUnresolved && !isCredentialListSettled,
  };
};
