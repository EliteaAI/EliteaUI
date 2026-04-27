import { useCallback, useMemo } from 'react';

import { Box, IconButton, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import DeleteIcon from '@/components/Icons/DeleteIcon';

import AddItemButton from './AddItemButton';

const MAX_CONVERSATION_STARTERS = 4;

const ConversationStartersWithoutFormik = ({ style, disabled, values, onChange }) => {
  const theme = useTheme();
  const disableAdd = useMemo(() => values.length >= MAX_CONVERSATION_STARTERS, [values]);

  const handleAdd = useCallback(() => {
    onChange([...values, '']);
  }, [onChange, values]);

  const handleDelete = useCallback(
    index => () => {
      onChange(values.filter((item, idx) => idx !== index));
    },
    [onChange, values],
  );

  const handleChange = useCallback(
    index => event => {
      onChange(values.map((item, idx) => (idx === index ? event.target.value : item)));
    },
    [onChange, values],
  );

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
      items={[
        {
          title: 'Conversation starters',
          content: (
            <>
              {values.map((value, index) => (
                <Box
                  display="flex"
                  gap="16px"
                  alignItems="flex-end"
                  marginTop="8px"
                  key={index}
                >
                  <Input.StyledInputEnhancer
                    autoComplete="off"
                    variant="standard"
                    fullWidth
                    placeholder="Conversation message"
                    value={value}
                    onChange={handleChange(index)}
                    containerProps={{ display: 'flex', flex: 2 }}
                    multiline
                    maxRows={15}
                    disabled={disabled}
                    hasActionsToolBar
                    fieldName={'Conversation starter'}
                  />
                  {!disabled && (
                    <Box paddingBottom={'8px'}>
                      <Tooltip
                        placement="top"
                        title="Delete"
                      >
                        <IconButton
                          variant="alita"
                          color="tertiary"
                          aria-label="delete starter"
                          onClick={handleDelete(index)}
                          sx={{ marginLeft: '0px' }}
                        >
                          <DeleteIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              ))}
              {!disabled && (
                <Tooltip
                  placement="top-start"
                  title={disableAdd ? 'You have reached the limit of conversation starters' : ''}
                  extraStyles={{ maxWidth: 400 }}
                >
                  <span>
                    <AddItemButton
                      sx={{ marginTop: '4px' }}
                      disabled={disableAdd}
                      onClick={disableAdd ? null : handleAdd}
                      title="Starter"
                    />
                  </span>
                </Tooltip>
              )}
            </>
          ),
        },
      ]}
    />
  );
};

export default ConversationStartersWithoutFormik;
