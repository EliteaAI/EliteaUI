import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Box, Button as MuiButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useTrackEvent } from '@/GA';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { Button } from '@/[fsd]/shared/ui';
import { SearchParams } from '@/common/constants.js';
import eventEmitter from '@/common/eventEmitter';
import { buildErrorMessage } from '@/common/utils.jsx';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useCreateToolkit from '@/hooks/toolkit/useCreateToolkit.jsx';
import useNavBlocker from '@/hooks/useNavBlocker';
import useToast from '@/hooks/useToast.jsx';
import { ToolEvents, ValidateToolEventReason } from '@/pages/Applications/Components/Tools/consts.js';
import { TabBarItems } from '@/pages/Common/Components';
import RouteDefinitions from '@/routes.js';

export default function CreateToolkitToolTabBar({
  onClearEditTool,
  hasNotSavedCredentials,
  hasCredentialsProperties,
  isMCP,
  setShowValidation,
}) {
  const trackEvent = useTrackEvent();

  const formik = useFormikContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toastError } = useToast();

  const [wantToCancel, setWantToCancel] = useState(false);
  const [wantToSave, setWantToSave] = useState(false);
  const { isLoading, create, error, isError } = useCreateToolkit(formik);

  //@todo: add Save button disable functionality based on the tool validation schema taking into account formik
  const shouldDisableSave = useMemo(() => {
    return isLoading || !formik?.dirty;
  }, [isLoading, formik?.dirty]);

  //@todo: add tooltip title for the button functionality based on the tool validation schema taking into account formik
  const tooltipTitle = useMemo(() => {
    return hasNotSavedCredentials ? 'Save credentials' : 'Save toolkit';
  }, [hasNotSavedCredentials]);

  const onSaveRef = React.useRef(create);

  useEffect(() => {
    onSaveRef.current = create;
  }, [create]);

  const blockOptions = useMemo(() => {
    return {
      blockCondition: !!formik?.dirty && !wantToCancel && !wantToSave,
    };
  }, [formik?.dirty, wantToCancel, wantToSave]);

  // Only use nav blocker when the form is actually dirty and user hasn't indicated intent to save/cancel
  const shouldUseNavBlocker = !!formik?.dirty && !wantToCancel && !wantToSave;

  useNavBlocker(shouldUseNavBlocker ? blockOptions : { blockCondition: false });

  const onClickSave = useCallback(() => {
    if (setShowValidation) setShowValidation(true);
    setWantToSave(() => true);
    if (hasCredentialsProperties) {
      eventEmitter.emit(
        ToolEvents.ToolkitsCreateToolkitWithConfiguration,
        ValidateToolEventReason.createAgent,
      );
    } else {
      eventEmitter.emit(ToolEvents.ToolkitsCreateToolkit, ValidateToolEventReason.createAgent);
    }
  }, [hasCredentialsProperties, setShowValidation]);

  const onCancel = useCallback(() => {
    setWantToCancel(true);
    // removeParamsFromUrl();
  }, [setWantToCancel]);

  useEffect(() => {
    if (wantToCancel) {
      onClearEditTool();
      formik.resetForm();
    }
  }, [onClearEditTool, wantToCancel, formik]);

  React.useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  const onSaveEvent = useCallback(
    async reason => {
      if (reason === ValidateToolEventReason.createAgent) {
        setTimeout(async () => {
          onSaveRef.current().then(data => {
            if (data.error) {
              return;
            }

            if (isMCP)
              trackEvent(GA_EVENT_NAMES.MCP_CREATED, {
                [GA_EVENT_PARAMS.MCP_TYPE]: formik.values?.type || 'unknown',
              });
            else
              trackEvent(GA_EVENT_NAMES.TOOLKIT_CREATED, {
                [GA_EVENT_PARAMS.TOOLKIT_TYPE]: formik.values?.type || 'unknown',
              });

            // Check if we came from a source application (agent/pipeline) and should return
            const returnUrl = searchParams.get(SearchParams.ReturnUrl);
            const sourceApplicationId = searchParams.get(SearchParams.SourceApplicationId);

            if (returnUrl && sourceApplicationId && data?.data?.id) {
              // Return to source application with the new toolkit ID for auto-association
              const decodedReturnUrl = decodeURIComponent(returnUrl);
              const urlObj = new URL(decodedReturnUrl, window.location.origin);
              // If 'edited_participant_id' is present in the original return_url, keep it
              const editedParticipantId = urlObj.searchParams.get(SearchParams.EditedParticipantId);
              urlObj.searchParams.set('newToolkitId', data.data.id);
              if (editedParticipantId) {
                urlObj.searchParams.set(SearchParams.EditedParticipantId, editedParticipantId);
              } else {
                urlObj.searchParams.delete(SearchParams.EditedParticipantId);
              }
              navigate(
                {
                  pathname: urlObj.pathname,
                  search: urlObj.search,
                },
                { replace: true },
              );
            } else {
              // Default behavior - navigate to toolkit/MCP detail page
              // For pre-built MCPs (mcp_github, etc.), navigate to MCP page
              const isPrebuildMcp = McpAuthHelpers.isPrebuildMcpType(formik.values?.type);
              const shouldNavigateToMcp = isMCP || isPrebuildMcp;

              navigate(
                {
                  pathname:
                    (!shouldNavigateToMcp
                      ? RouteDefinitions.ToolkitsWithTab
                      : RouteDefinitions.MCPsWithTab
                    ).replace(':tab', 'all') + `/${data.data.id}`,
                },
                {
                  replace: true,
                },
              );
            }
          });
        }, 0);
      }
    },
    [formik.values?.type, isMCP, navigate, searchParams, trackEvent],
  );

  useEffect(() => {
    eventEmitter.on(ToolEvents.SaveEvent, onSaveEvent);
    return () => {
      eventEmitter.off(ToolEvents.SaveEvent, onSaveEvent);
    };
  }, [onSaveEvent]);

  return (
    <>
      <TabBarItems>
        <Tooltip
          title={tooltipTitle}
          placement="top"
        >
          <Box component="span">
            <MuiButton
              variant="elitea"
              color="primary"
              disabled={shouldDisableSave}
              onClick={onClickSave}
            >
              {hasNotSavedCredentials ? 'Save Credentials' : 'Save'}
              {isLoading && <StyledCircleProgress size={20} />}
            </MuiButton>
          </Box>
        </Tooltip>
        <Button.DiscardButton
          title="Cancel"
          disabled={isLoading}
          onDiscard={onCancel}
          alertContent="Are you sure you want to cancel creation of this toolkit?"
        />
      </TabBarItems>
    </>
  );
}
