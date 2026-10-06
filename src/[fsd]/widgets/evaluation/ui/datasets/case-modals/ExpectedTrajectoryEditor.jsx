import { memo, useCallback, useId } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { Button, Checkbox, Input } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import SingleSelect from '@/[fsd]/shared/ui/select/SingleSelect';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import PlusIcon from '@/components/Icons/PlusIcon';

import {
  ARGS_MATCH_OPTIONS,
  TRAJECTORY_MATCH_HINTS,
  TRAJECTORY_MATCH_OPTIONS,
  newTrajectoryToolRow,
} from '../../../lib/helpers';

const SECTION_TOOLTIP =
  'An optional reference for how the agent should use its tools on this case. The built-in ' +
  'trajectory dimensions score against it; a check whose part is left empty is skipped, not failed.';
const TOOLS_TOOLTIP =
  'Tool names as the agent records them. Suggestions come from the agent’s toolkits; MCP and other ' +
  'toolkits without a fixed tool list need the name typed in. Arguments are an optional JSON object.';
const FORBIDDEN_TOOLTIP = 'Comma-separated tools the agent must not call on this case.';
const ALLOW_REPEAT_TOOLTIP =
  'Comma-separated tools that may be called again with the same arguments (polling and the like) ' +
  'without counting as redundant.';
const MAX_CALLS_TOOLTIP = 'The most tool calls the agent may make on this case. Leave empty for no budget.';

const ExpectedTrajectoryEditor = memo(props => {
  const { form, onChange, toolOptions = [], readOnly = false } = props;
  const listId = `expected-trajectory-tools-${useId().replace(/:/g, '')}`;

  const setField = useCallback((key, value) => onChange({ ...form, [key]: value }), [form, onChange]);

  const setTool = useCallback(
    (index, key, value) =>
      onChange({ ...form, tools: form.tools.map((row, i) => (i === index ? { ...row, [key]: value } : row)) }),
    [form, onChange],
  );

  const handleToggle = useCallback(event => setField('enabled', event.target.checked), [setField]);
  const handleMatch = useCallback(value => setField('match', value), [setField]);
  const handleAddTool = useCallback(
    () => onChange({ ...form, tools: [...form.tools, newTrajectoryToolRow()] }),
    [form, onChange],
  );
  const handleRemoveTool = useCallback(
    index => onChange({ ...form, tools: form.tools.filter((_, i) => i !== index) }),
    [form, onChange],
  );
  const handleMoveTool = useCallback(
    (index, delta) => {
      const target = index + delta;
      if (target < 0 || target >= form.tools.length) return;
      const tools = [...form.tools];
      [tools[index], tools[target]] = [tools[target], tools[index]];
      onChange({ ...form, tools });
    },
    [form, onChange],
  );

  const readOnlyInputProps = readOnly ? { 'aria-readonly': true, readOnly: true, tabIndex: -1 } : {};
  const styles = expectedTrajectoryEditorStyles();

  const textField = ({ testId, value, onValue, placeholder, inputProps, multiline }) => (
    <Input.InputBase
      fullWidth
      variant="outlined"
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      placeholder={readOnly ? '' : placeholder}
      value={value}
      onChange={readOnly ? undefined : event => onValue(event.target.value)}
      inputProps={{ ...inputProps, ...readOnlyInputProps }}
      data-testid={testId}
      showFullScreenAction={false}
      showCopyAction={false}
      showExpandAction={false}
      sx={[styles.field, readOnly && styles.readOnlyField]}
    />
  );

  const label = (text, tooltip) => (
    <Box sx={styles.labelRow}>
      <Typography sx={styles.label}>{text}</Typography>
      {!readOnly && tooltip && <InfoTooltip infoTooltip={tooltip} />}
    </Box>
  );

  return (
    <Box
      sx={styles.section}
      data-testid="create-case-expected-trajectory"
    >
      <Box sx={styles.header}>
        <Checkbox.BaseCheckbox
          checked={form.enabled}
          onChange={readOnly ? undefined : handleToggle}
          disabled={readOnly}
          sx={styles.checkbox}
          data-testid="create-case-expected-trajectory-checkbox"
        />
        <Typography sx={styles.label}>Expected Trajectory</Typography>
        {!readOnly && <InfoTooltip infoTooltip={SECTION_TOOLTIP} />}
      </Box>

      {form.enabled && (
        <Box sx={styles.body}>
          <datalist id={listId}>
            {toolOptions.map(name => (
              <option
                key={name}
                value={name}
              />
            ))}
          </datalist>

          <Box sx={styles.column}>
            {label('Match')}
            <SingleSelect
              showBorder
              value={form.match}
              options={TRAJECTORY_MATCH_OPTIONS}
              onValueChange={handleMatch}
              disabled={readOnly}
              data-testid="create-case-expected-trajectory-match"
            />
            <Typography sx={styles.hint}>{TRAJECTORY_MATCH_HINTS[form.match]}</Typography>
          </Box>

          <Box sx={styles.column}>
            {label('Expected tool calls', TOOLS_TOOLTIP)}
            {form.tools.length === 0 ? (
              <Typography sx={styles.hint}>No expected tool calls.</Typography>
            ) : (
              form.tools.map((row, index) => (
                <Box
                  key={row.id}
                  sx={styles.toolRow}
                  data-testid={`create-case-expected-tool-${index}`}
                >
                  <Box sx={styles.toolMain}>
                    <Typography sx={styles.toolIndex}>{index + 1}.</Typography>
                    {textField({
                      testId: `create-case-expected-tool-name-${index}`,
                      value: row.name,
                      onValue: value => setTool(index, 'name', value),
                      placeholder: 'Tool name',
                      inputProps: { list: listId, autoComplete: 'off' },
                    })}
                    {!readOnly && (
                      <Box sx={styles.rowActions}>
                        <Tooltip
                          title="Move up"
                          placement="top"
                        >
                          <span>
                            <Button.BaseBtn
                              variant={BUTTON_VARIANTS.tertiary}
                              disabled={index === 0}
                              onClick={() => handleMoveTool(index, -1)}
                              data-testid={`create-case-expected-tool-up-${index}`}
                              sx={styles.iconButton}
                            >
                              <ArrowDownIcon style={styles.arrowUp} />
                            </Button.BaseBtn>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title="Move down"
                          placement="top"
                        >
                          <span>
                            <Button.BaseBtn
                              variant={BUTTON_VARIANTS.tertiary}
                              disabled={index === form.tools.length - 1}
                              onClick={() => handleMoveTool(index, 1)}
                              data-testid={`create-case-expected-tool-down-${index}`}
                              sx={styles.iconButton}
                            >
                              <ArrowDownIcon style={styles.arrow} />
                            </Button.BaseBtn>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title="Remove tool call"
                          placement="top"
                        >
                          <Button.BaseBtn
                            variant={BUTTON_VARIANTS.tertiary}
                            onClick={() => handleRemoveTool(index)}
                            data-testid={`create-case-expected-tool-remove-${index}`}
                            sx={styles.iconButton}
                          >
                            <DeleteIcon sx={styles.deleteIcon} />
                          </Button.BaseBtn>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                  {(!readOnly || row.argsText) && (
                    <Box sx={styles.toolArgs}>
                      {textField({
                        testId: `create-case-expected-tool-args-${index}`,
                        value: row.argsText,
                        onValue: value => setTool(index, 'argsText', value),
                        placeholder: 'Arguments (optional JSON object), e.g. {"project": "EL"}',
                        multiline: true,
                      })}
                      {row.argsText.trim() && (
                        <Box sx={styles.argsMatch}>
                          <SingleSelect
                            showBorder
                            value={row.argsMatch}
                            options={ARGS_MATCH_OPTIONS}
                            onValueChange={value => setTool(index, 'argsMatch', value)}
                            disabled={readOnly}
                            data-testid={`create-case-expected-tool-args-match-${index}`}
                          />
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              ))
            )}
            {!readOnly && (
              <Button.BaseBtn
                color={BUTTON_COLORS.secondary}
                startIcon={<PlusIcon />}
                onClick={handleAddTool}
                sx={styles.addButton}
                data-testid="create-case-expected-tool-add"
              >
                Tool call
              </Button.BaseBtn>
            )}
          </Box>

          <Box sx={styles.pair}>
            <Box sx={styles.column}>
              {label('Forbidden tools', FORBIDDEN_TOOLTIP)}
              {textField({
                testId: 'create-case-expected-trajectory-forbidden',
                value: form.forbiddenText,
                onValue: value => setField('forbiddenText', value),
                placeholder: 'e.g. delete_branch, drop_table',
              })}
            </Box>
            <Box sx={styles.column}>
              {label('Allowed repeats', ALLOW_REPEAT_TOOLTIP)}
              {textField({
                testId: 'create-case-expected-trajectory-allow-repeat',
                value: form.allowRepeatText,
                onValue: value => setField('allowRepeatText', value),
                placeholder: 'e.g. get_job_status',
              })}
            </Box>
          </Box>

          <Box sx={styles.budget}>
            {label('Max tool calls', MAX_CALLS_TOOLTIP)}
            {textField({
              testId: 'create-case-expected-trajectory-max-calls',
              value: form.maxToolCalls,
              onValue: value => setField('maxToolCalls', value),
              placeholder: 'No budget',
              inputProps: { inputMode: 'numeric' },
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
});

ExpectedTrajectoryEditor.displayName = 'ExpectedTrajectoryEditor';

/** @type {MuiSx} */
const expectedTrajectoryEditorStyles = () => ({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkbox: {
    padding: 0,
    marginRight: '0.25rem',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '0 0 0 1.5rem',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  pair: {
    display: 'flex',
    gap: '0.75rem',
  },
  budget: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '12rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    color: palette.text.primary,
  }),
  hint: ({ palette }) => ({
    fontSize: '0.75rem',
    lineHeight: '1rem',
    color: palette.text.muted,
  }),
  toolRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  toolMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  toolIndex: ({ palette }) => ({
    fontSize: '0.75rem',
    minWidth: '1.25rem',
    color: palette.text.secondary,
  }),
  toolArgs: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    paddingLeft: '1.75rem',
  },
  argsMatch: {
    width: '10rem',
    flexShrink: 0,
  },
  rowActions: {
    display: 'flex',
    alignItems: 'center',
  },
  field: {
    '& .MuiOutlinedInput-root': {
      minHeight: '2.5rem',
    },
    '& .MuiOutlinedInput-input.MuiInputBase-inputMultiline': {
      maxHeight: '6rem',
      overflowY: 'auto',
      fontFamily: 'monospace',
    },
  },
  readOnlyField: ({ palette }) => ({
    pointerEvents: 'none',
    '& .MuiInputBase-input': {
      caretColor: 'transparent',
    },
    '& .MuiOutlinedInput-root:not(.Mui-error):hover .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline':
      {
        borderColor: palette.border.lines,
      },
  }),
  iconButton: ({ palette }) => ({
    padding: '0.25rem',
    minWidth: 0,
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  arrow: {
    width: '1rem',
    height: '1rem',
  },
  arrowUp: {
    width: '1rem',
    height: '1rem',
    transform: 'rotate(180deg)',
  },
  deleteIcon: ({ palette }) => ({
    fontSize: '1rem',
    '& path': {
      fill: palette.icon.default,
    },
  }),
  addButton: ({ palette }) => ({
    alignSelf: 'flex-start',
    padding: '0.375rem 0.75rem',
    borderRadius: '1.25rem',
    borderColor: palette.border.lines,
    color: palette.text.secondary,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 500,
    '& .MuiButton-startIcon svg': {
      width: '0.75rem',
      height: '0.75rem',
    },
    '& svg path': {
      fill: palette.icon.secondary,
    },
    '&:hover': {
      borderColor: palette.border.lines,
      backgroundColor: palette.background.surface.interactive.default,
    },
  }),
});

export default ExpectedTrajectoryEditor;
