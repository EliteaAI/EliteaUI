import { memo, useCallback, useEffect, useRef, useState } from 'react';

import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import { Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Field } from '@/[fsd]/shared/ui';
import StyledInputModal from '@/components/StyledInputModal';

const ResizableCodeMirrorEditor = memo(props => {
  const { fieldName, value, onChange, extensions, minHeight = 120, expandAction = false, ...rest } = props;
  const [currentValue, setCurrentValue] = useState(value);
  const styles = resizableCodeMirrorEditorStyles({ minHeight });
  const resizeBoxRef = useRef();

  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [editorHeight, setEditorHeight] = useState(200);

  useEffect(() => {
    if (!resizeBoxRef.current) return;

    const observer = new window.ResizeObserver(entries => {
      for (const entry of entries) {
        setEditorHeight(entry.contentRect.height);
      }
    });

    observer.observe(resizeBoxRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleChange = useCallback(newValue => {
    setCurrentValue(newValue);
  }, []);

  const handleBlur = useCallback(() => {
    if (!rest?.readOnly) {
      onChange?.(currentValue);
    }
  }, [rest?.readOnly, onChange, currentValue]);

  const toggleFullScreen = useCallback(state => {
    setFullScreenMode(state);
  }, []);

  const handleChangeFromFullScreenModal = useCallback(
    ({ target }) => {
      handleChange(target.value);
      handleBlur();
    },
    [handleBlur, handleChange],
  );

  return (
    <>
      <Box
        ref={resizeBoxRef}
        sx={styles.wrapper}
        className="index-config-field"
      >
        {expandAction && (
          <Box
            aria-label="full-scrn-btn"
            sx={styles.fullScreenWrapper}
          >
            <Tooltip
              title="Full screen view"
              placement="top"
            >
              <IconButton
                variant="alita"
                color="tertiary"
                onClick={() => toggleFullScreen(true)}
              >
                <FullscreenOutlinedIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        <Field.CodeMirrorEditor
          value={currentValue}
          extensions={extensions}
          height={editorHeight + 'px'}
          minHeight={minHeight + 'px'}
          onBlur={handleBlur}
          notifyChange={handleChange}
          {...rest}
        />
      </Box>
      {fullScreenMode && (
        <StyledInputModal
          value={currentValue}
          title={fieldName}
          key={fullScreenMode}
          open={fullScreenMode}
          hasOnChangeCallback={!!onChange}
          onChange={handleChangeFromFullScreenModal}
          onClose={() => toggleFullScreen(false)}
          specifiedLanguage="json"
          disabled={rest?.readOnly}
        />
      )}
    </>
  );
});

ResizableCodeMirrorEditor.displayName = 'ResizableCodeMirrorEditor';

/** @type {MuiSx} */
const resizableCodeMirrorEditorStyles = ({ minHeight }) => ({
  wrapper: ({ palette }) => ({
    boxSizing: 'border-box',
    position: 'relative',
    width: '100%',
    resize: 'vertical',
    overflow: 'auto',
    minHeight,
    height: 200,
    border: `1px solid ${palette.border.table}`,
    borderRadius: '6px',
    transition: 'border-color 0.2s ease',

    '&:hover': {
      borderColor: palette.border.hover,
      '& [aria-label="full-scrn-btn"]': { display: 'block' },
    },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
  fullScreenWrapper: {
    position: 'absolute',
    display: 'none',
    top: '-.1rem',
    right: '-0.1rem',
    zIndex: 10,

    '&:hover': {
      button: {
        background: 'transparent',
      },
    },
  },
});

export default ResizableCodeMirrorEditor;
