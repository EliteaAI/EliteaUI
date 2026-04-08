import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography, debounce } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { MAX_WELCOME_MESSAGE_LENGTH, PROMPT_PAYLOAD_KEY } from '@/common/constants';
import { useTheme } from '@emotion/react';

const WelcomeMessage = memo(props => {
  const { welcome_message, onChangeWelcomeMessage, style, disabled } = props;

  const { toggleFieldFocus, isFocused } = useFieldFocus();
  const theme = useTheme();
  const [inputValue, setInputValue] = useState(welcome_message);

  // Only sync from Formik on reset/discard, not on every keystroke.
  useEffect(() => {
    if (welcome_message !== inputValue) {
      setInputValue(welcome_message);
    }
    // Only update if Formik's value is different (e.g., after reset/discard)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcome_message]);

  const debouncedChange = useMemo(
    () =>
      debounce(event => {
        onChangeWelcomeMessage(event);
      }, 100),
    [onChangeWelcomeMessage],
  );

  const handleInput = useCallback(
    event => {
      event.preventDefault();
      setInputValue(event.target.value);
      debouncedChange(event);
    },
    [debouncedChange],
  );

  return (
    <BasicAccordion
      style={style}
      accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      items={[
        {
          title: 'Welcome message',
          content: (
            <>
              <Box>
                <Input.StyledInputEnhancer
                  autoComplete="off"
                  showexpandicon="true"
                  maxRows={15}
                  multiline
                  variant="standard"
                  fullWidth
                  name="welcome_message"
                  id="welcome_message"
                  placeholder="Input your welcome message"
                  value={inputValue}
                  inputProps={{ maxLength: MAX_WELCOME_MESSAGE_LENGTH }}
                  onChange={handleInput}
                  onFocus={() => toggleFieldFocus(PROMPT_PAYLOAD_KEY.welcomeMessage)}
                  onBlur={() => toggleFieldFocus(null)}
                  hasActionsToolBar
                  fieldName="Welcome message"
                  disabled={disabled}
                />
                {isFocused(PROMPT_PAYLOAD_KEY.welcomeMessage) && inputValue.length > 0 && (
                  <Typography variant="bodySmall">
                    {`${MAX_WELCOME_MESSAGE_LENGTH - inputValue.length} characters left`}
                  </Typography>
                )}
              </Box>
            </>
          ),
        },
      ]}
    />
  );
});

WelcomeMessage.displayName = 'WelcomeMessage';

export default WelcomeMessage;
