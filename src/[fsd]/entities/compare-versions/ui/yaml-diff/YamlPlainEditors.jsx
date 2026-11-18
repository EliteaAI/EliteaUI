import { memo } from 'react';

import { Box } from '@mui/material';

import { Field } from '@/[fsd]/shared/ui';
import { StreamLanguage } from '@codemirror/language';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';

const YAML_EXTENSIONS = [StreamLanguage.define(yaml)];

// Two plain YAML editors, for texts too large to diff side by side; still editable and savable
const YamlPlainEditors = memo(props => {
  const { leftValue, rightValue, onLeftChange, onRightChange } = props;
  const styles = yamlPlainEditorsStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="compare-yaml-plain-editors"
    >
      {[
        { side: 'left', value: leftValue, onChange: onLeftChange },
        { side: 'right', value: rightValue, onChange: onRightChange },
      ].map(({ side, value, onChange }) => (
        <Box
          key={side}
          sx={styles.editor}
        >
          <Field.CodeMirrorEditor
            value={value}
            notifyChange={onChange}
            extensions={YAML_EXTENSIONS}
            height="100%"
            minHeight="100%"
            variant="bodySmall"
            contentTestId={`compare-yaml-${side}`}
          />
        </Box>
      ))}
    </Box>
  );
});

YamlPlainEditors.displayName = 'YamlPlainEditors';

/** @type {MuiSx} */
const yamlPlainEditorsStyles = () => ({
  root: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    display: 'flex',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    overflow: 'hidden',
  }),
  editor: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    '& + &': { borderLeft: `0.0625rem solid ${palette.border.lines}` },
  }),
});

export default YamlPlainEditors;
