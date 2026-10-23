import { describe, expect, it } from 'vitest';

import { createTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import darkPalette from '@/darkPalette';

import {
  getNodeCardBorderColor,
  getNodeCardHeaderColor,
  getNodeCardShadow,
  getNodeCardStatus,
  hasNodeCardHover,
  isMiniCardZoom,
  withFullNodeSizes,
} from '../nodeCard.helpers';

const { NodeCardStatus, PipelineNodeTypes } = FlowEditorConstants;

const theme = createTheme({ palette: darkPalette });
const { palette } = theme;
const { card } = palette.components.flowEditor;

describe('nodeCard.helpers', () => {
  describe('getNodeCardStatus', () => {
    it('returns running for the performing node', () => {
      expect(getNodeCardStatus({ isPerforming: true })).toBe(NodeCardStatus.running);
    });

    it('returns error when the run failed on the node', () => {
      expect(getNodeCardStatus({ hasRunError: true })).toBe(NodeCardStatus.error);
    });

    it('returns needsConfiguration when the node has config issues', () => {
      expect(getNodeCardStatus({ hasConfigIssues: true })).toBe(NodeCardStatus.needsConfiguration);
    });

    it('lets run states win over needsConfiguration', () => {
      expect(getNodeCardStatus({ isPerforming: true, hasConfigIssues: true })).toBe(NodeCardStatus.running);
      expect(getNodeCardStatus({ hasRunError: true, hasConfigIssues: true })).toBe(NodeCardStatus.error);
    });

    it('returns null for a resting node', () => {
      expect(getNodeCardStatus({})).toBeNull();
      expect(getNodeCardStatus()).toBeNull();
    });
  });

  describe('getNodeCardBorderColor', () => {
    it('uses the default border for a resting node', () => {
      expect(getNodeCardBorderColor({}, palette)).toBe(card.border.default);
    });

    it('uses the selected border for a selected node', () => {
      expect(getNodeCardBorderColor({ selected: true }, palette)).toBe(card.border.selected);
    });

    it('ignores selection while the pipeline runs', () => {
      expect(getNodeCardBorderColor({ selected: true, isRunningPipeline: true }, palette)).toBe(
        card.border.default,
      );
    });

    it('lets the run status win over selection', () => {
      expect(getNodeCardBorderColor({ status: NodeCardStatus.running, selected: true }, palette)).toBe(
        card.border.running,
      );
      expect(getNodeCardBorderColor({ status: NodeCardStatus.error }, palette)).toBe(card.border.error);
    });
  });

  describe('needs configuration', () => {
    const status = NodeCardStatus.needsConfiguration;

    it('shows the red border on a resting node, without glow or hover', () => {
      expect(getNodeCardBorderColor({ status }, palette)).toBe(card.border.needsConfiguration);
      expect(getNodeCardShadow({ status }, palette)).toBe(card.shadow.default);
      expect(hasNodeCardHover({ status })).toBe(false);
    });

    it('lets selection win so the selected card stays visible', () => {
      expect(getNodeCardBorderColor({ status, selected: true }, palette)).toBe(card.border.selected);
      expect(getNodeCardShadow({ status, selected: true }, palette)).toBe(card.shadow.selected);
    });

    it('keeps the red border while a pipeline runs, even if selected', () => {
      expect(getNodeCardBorderColor({ status, selected: true, isRunningPipeline: true }, palette)).toBe(
        card.border.needsConfiguration,
      );
    });
  });

  describe('getNodeCardShadow', () => {
    it('glows for a selected node', () => {
      expect(getNodeCardShadow({ selected: true }, palette)).toBe(card.shadow.selected);
      expect(getNodeCardShadow({}, palette)).toBe(card.shadow.default);
    });

    it('glows like a selected node while the node is running', () => {
      expect(getNodeCardShadow({ status: NodeCardStatus.running, isRunningPipeline: true }, palette)).toBe(
        card.shadow.selected,
      );
    });

    it('does not glow for a run error', () => {
      expect(getNodeCardShadow({ status: NodeCardStatus.error, selected: true }, palette)).toBe(
        card.shadow.default,
      );
    });
  });

  describe('hasNodeCardHover', () => {
    it('applies hover only to a resting node', () => {
      expect(hasNodeCardHover({})).toBe(true);
      expect(hasNodeCardHover({ selected: true })).toBe(false);
      expect(hasNodeCardHover({ status: NodeCardStatus.running })).toBe(false);
      expect(hasNodeCardHover({ selected: true, isRunningPipeline: true })).toBe(true);
    });
  });

  describe('getNodeCardHeaderColor', () => {
    it('uses the add-node selector colour for addable types', () => {
      expect(getNodeCardHeaderColor(PipelineNodeTypes.Agent, theme)).toBe(
        palette.components.flowEditor.nodeTypeIcon.background.agent,
      );
    });

    it('falls back to the node colour for deprecated types', () => {
      expect(getNodeCardHeaderColor(PipelineNodeTypes.Loop, theme)).toBe(
        palette.components.flowEditor.nodeColors.loop,
      );
    });
  });

  describe('mini cards', () => {
    it('switches to mini cards below 60% zoom', () => {
      expect(isMiniCardZoom(0.59)).toBe(true);
      expect(isMiniCardZoom(0.6)).toBe(false);
      expect(isMiniCardZoom(1)).toBe(false);
    });

    it('restores full sizes and drops sizes never measured at full size', () => {
      const nodes = [
        { id: 'a', measured: { width: 471, height: 66 } },
        { id: 'b', measured: { width: 471, height: 66 } },
      ];

      expect(withFullNodeSizes(nodes, { a: { width: 471, height: 420 } })).toEqual([
        { id: 'a', measured: { width: 471, height: 420 } },
        { id: 'b', measured: undefined },
      ]);
    });
  });
});
