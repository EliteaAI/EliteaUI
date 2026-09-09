import { useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';
import YAML from 'js-yaml';
import { useDispatch, useSelector } from 'react-redux';

import {
  DefaultState,
  STATE_INPUT_ATTACHMENTS,
  StateVariableTypes,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { DEFAULT_PIPELINE_KEY } from '@/[fsd]/features/pipelines/lib/constants';
import { actions as pipelineActions } from '@/slices/pipeline';

const ATTACHMENTS_TOOL_NAME = 'attachments';

const EMPTY_PIPELINE_STATE = { yamlCode: '', yamlJsonObject: {} };

/**
 * Watches the pipeline's internal_tools list and keeps the `input_attachments`
 * YAML state variable in sync: adds it when attachments are enabled, removes it
 * when they are disabled.
 *
 * Must be called inside a Formik context on the pipeline configuration page.
 *
 * @param {boolean} [isVisible=true] - Whether the owning tab is currently active.
 *   When false, no dispatches are made. Prevents cross-tab contamination in Canvas
 *   where multiple PipelineEditor instances are mounted simultaneously.
 * @param {string|null} [pipelineKey=null] - Per-tab Redux key (e.g. "projectId_pipelineId").
 *   When provided, reads from and writes to that specific byKey slot rather than using
 *   the globally active key. Falls back to DEFAULT_PIPELINE_KEY when null.
 */
export const usePipelineAttachmentYamlSync = (isVisible = true, pipelineKey = null) => {
  const { values } = useFormikContext();
  const dispatch = useDispatch();

  const resolvedKey = pipelineKey ?? DEFAULT_PIPELINE_KEY;

  // Read directly from the specific key so this tab never sees another tab's active data.
  const { yamlCode, yamlJsonObject } = useSelector(
    state => state.pipeline.byKey[resolvedKey] ?? EMPTY_PIPELINE_STATE,
  );

  const hasAttachments =
    values?.version_details?.meta?.internal_tools?.includes(ATTACHMENTS_TOOL_NAME) ?? false;

  // Keep a ref so the effect always reads the latest YAML object without
  // needing to re-run whenever any unrelated YAML change happens.
  const yamlJsonObjectRef = useRef(yamlJsonObject);
  yamlJsonObjectRef.current = yamlJsonObject;

  // Track visibility in a ref so the effect's stable closure can check it
  // without adding isVisible to the dependency array (which would cause extra runs).
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  useEffect(() => {
    // Skip when this tab is hidden to avoid writing to the wrong Redux key.
    // The active tab has its own mounted PipelineAttachmentYamlSync that handles sync.
    if (!isVisibleRef.current) return;

    const currentYamlObj = yamlJsonObjectRef.current;
    const currentState = currentYamlObj?.state || { ...DefaultState };
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
