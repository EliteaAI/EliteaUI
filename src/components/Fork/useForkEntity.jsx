import * as React from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import { useTrackEvent } from '@/GA';
import { actions as importWizardActions } from '@/[fsd]/entities/import-wizard/model/importWizard.slice';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useLazyApplicationExportQuery } from '@/api/applications';
import { useToolkitForkMutation } from '@/api/toolkits';
import {
  isApplicationCard,
  isCredentialCard,
  isMCPCard,
  isPipelineCard,
  isToolkitCard,
} from '@/common/checkCardType';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useForkEntity = ({ id, entity_name, title, data = {} }) => {
  const { toastError } = useToast();
  const dispatch = useDispatch();
  const trackEvent = useTrackEvent();

  const { values: { name: entityName, version_details } = {} } = useFormikContext();

  const [exportApplication, { isFetching: isLoadingApplication }] = useLazyApplicationExportQuery();
  const [forkToolkit, { isFetching: isLoadingToolkit }] = useToolkitForkMutation();

  const exportFunc = React.useMemo(() => {
    switch (entity_name) {
      case 'applications':
      case 'pipelines':
        return exportApplication;
      case 'toolkits':
        return forkToolkit;

      default:
        return () => ({});
    }
  }, [entity_name, exportApplication, forkToolkit]);

  const tooltipTitle = React.useMemo(() => {
    if (title) {
      return title;
    }
    switch (entity_name) {
      case 'applications':
        return 'Fork agent';
      case 'pipelines':
        return 'Fork pipeline';
      case 'toolkits':
        return 'Fork toolkit';
      default:
        return '';
    }
  }, [entity_name, title]);

  const projectId = useSelectedProjectId();

  const doFork = React.useCallback(async () => {
    let result;

    if (projectId) {
      switch (entity_name) {
        case 'toolkits':
          if (data) {
            result = await exportFunc({ projectId, id, isDial: false, fork: true, data });
          }
          break;
        default: {
          result = await exportFunc({
            projectId,
            id,
            isDial: false,
            fork: true,
            follow_version_ids: version_details?.id ? [version_details.id] : [],
          });
        }
      }
    }

    if (result?.error) {
      toastError(buildErrorMessage(result?.error));
      return;
    }
    trackEvent(GA_EVENT_NAMES.ENTITY_FORKED, {
      [GA_EVENT_PARAMS.ENTITY_ID]: id || 'unknown',
      [GA_EVENT_PARAMS.ENTITY_NAME]: entityName || 'unknown',
      [GA_EVENT_PARAMS.ENTITY_TYPE]: entity_name || 'unknown',
      [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
    });
    dispatch(
      importWizardActions.openImportWizard({
        isForking: true,
        data: result.data,
      }),
    );
  }, [projectId, dispatch, entity_name, entityName, data, exportFunc, id, version_details?.id, toastError, trackEvent]);

  return {
    doFork,
    isLoading: isLoadingApplication || isLoadingToolkit,
    tooltipTitle,
  };
};

export const getEntityNameByCardType = cardType => {
  if (isApplicationCard(cardType)) {
    return 'applications';
  } else if (isPipelineCard(cardType)) {
    return 'pipelines';
  } else if (isToolkitCard(cardType)) {
    return 'toolkits';
  } else if (isMCPCard(cardType)) {
    return 'toolkits';
  } else if (isCredentialCard(cardType)) {
    return 'credentials';
  }
  return '';
};
