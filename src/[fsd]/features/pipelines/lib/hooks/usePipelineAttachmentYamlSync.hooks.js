import { useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';
import YAML from 'js-yaml';
import { useDispatch, useSelector } from 'react-redux';

import {
  STATE_INPUT_ATTACHMENTS,
  StateVariableTypes,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { actions as pipelineActions } from '@/slices/pipeline';

const ATTACHMENTS_TOOL_NAME = 'attachments';

/**
 * Watches the pipeline's internal_tools list and keeps the `input_attachments`
 * YAML state variable in sync: adds it when attachments are enabled, removes it
 * when they are disabled.
 *
 * Must be called inside a Formik context on the pipeline configuration page.
 */
export const usePipelineAttachmentYamlSync = () => {
  const { values } = useFormikContext();
  const dispatch = useDispatch();
  const { yamlCode, yamlJsonObject } = useSelector(state => state.pipeline);

  const hasAttachments =
    values?.version_details?.meta?.internal_tools?.includes(ATTACHMENTS_TOOL_NAME) ?? false;

  // Keep a ref so the effect always reads the latest YAML object without
  // needing to re-run whenever any unrelated YAML change happens.
  const yamlJsonObjectRef = useRef(yamlJsonObject);
  yamlJsonObjectRef.current = yamlJsonObject;

  useEffect(() => {
    const currentYamlObj = yamlJsonObjectRef.current;
    const currentState = currentYamlObj?.state || {};
    const alreadyHasKey = STATE_INPUT_ATTACHMENTS in currentState;

    if (hasAttachments && !alreadyHasKey) {
      const updated = {
        ...currentYamlObj,
        state: {
          ...currentState,
          [STATE_INPUT_ATTACHMENTS]: { type: StateVariableTypes.List, default: [] },
        },
      };
      dispatch(pipelineActions.setYamlCode(YAML.dump(updated)));
      dispatch(pipelineActions.setYamlJsonObject({ yamlJsonObject: updated }));
    } else if (!hasAttachments && alreadyHasKey) {
      const remainingState = Object.fromEntries(
        Object.entries(currentState).filter(([k]) => k !== STATE_INPUT_ATTACHMENTS),
      );
      const updated = { ...currentYamlObj, state: remainingState };
      dispatch(pipelineActions.setYamlCode(YAML.dump(updated)));
      dispatch(pipelineActions.setYamlJsonObject({ yamlJsonObject: updated }));
    }
  }, [hasAttachments, yamlCode, dispatch]);
};
