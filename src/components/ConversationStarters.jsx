import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, IconButton, ListItem, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import {
  MAX_CONVERSATION_STARTERS,
  MAX_CONVERSATION_STARTER_LENGTH,
  PROMPT_PAYLOAD_KEY,
} from '@/common/constants.js';
import AddItemButton from '@/components/AddItemButton';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const ConversationStarters = memo(props => {
  const { style, disabled } = props;

  const {
    values: { version_details },
    handleChange,
    setFieldValue,
  } = useFormikContext();

  const { toggleFieldFocus, isFocused } = useFieldFocus();
  const styles = conversationStartersStyles();
  const valuesPath = 'version_details.conversation_starters';
  const values = useMemo(
    () => version_details?.conversation_starters || [],
    [version_details?.conversation_starters],
  );

  const addButtonRef = useRef(null);
  const inputRefs = useRef({});
  const [shouldFocusIndex, setShouldFocusIndex] = useState(null);

  const onAdd = useCallback(() => {
    const newIndex = values.length;
    setFieldValue(valuesPath, [...values, '']);
    setShouldFocusIndex(newIndex);
    setTimeout(() => {
      if (addButtonRef.current) {
        addButtonRef.current.scrollIntoView({
          behavior: 'smooth',
        });
      }
    }, 0);
  }, [setFieldValue, values]);

  useEffect(() => {
    if (shouldFocusIndex !== null && inputRefs.current[shouldFocusIndex]) {
      inputRefs.current[shouldFocusIndex].focus();
      setShouldFocusIndex(null);
    }
  }, [shouldFocusIndex, values.length]);

  const onDelete = useCallback(
    index => () => {
      setFieldValue(
        valuesPath,
        values.filter((_, i) => i !== index),
      );
    },
    [setFieldValue, values],
  );
  const disableAdd = useMemo(() => values.length >= MAX_CONVERSATION_STARTERS, [values]);

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordionSX}
      items={[
        {
          title: 'Conversation starters',
          content: (
            <>
              {values.map((value, index) => {
                const starterFocusId = `${PROMPT_PAYLOAD_KEY.conversationStarters}_${index}`;
                return (
                  <Box
                    sx={styles.starterRow}
                    key={index}
                  >
                    <Box sx={styles.inputWrapper}>
                      <Input.StyledInputEnhancer
                        autoComplete="off"
                        variant="standard"
                        fullWidth
                        placeholder="Conversation message"
                        name={`${valuesPath}[${index}]`}
                        value={value}
                        onChange={handleChange}
                        onFocus={() => toggleFieldFocus(starterFocusId)}
                        onBlur={() => toggleFieldFocus(null)}
                        containerProps={{ display: 'flex', flex: 2 }}
                        multiline
                        maxRows={15}
                        hasActionsToolBar
                        disabled={disabled}
                        fieldName="Conversation starter"
                        inputProps={{ maxLength: MAX_CONVERSATION_STARTER_LENGTH }}
                        inputRef={el => (inputRefs.current[index] = el)}
                      />
                      {isFocused(starterFocusId) && value.length > 0 && (
                        <Typography
                          variant="bodySmall"
                          sx={styles.characterCount}
                        >
                          {`${MAX_CONVERSATION_STARTER_LENGTH - value.length} characters left`}
                        </Typography>
                      )}
                    </Box>
                    {!disabled && (
                      <Box sx={styles.deleteButtonWrapper}>
                        <Tooltip
                          placement="top"
                          title="Delete"
                        >
                          <IconButton
                            variant="alita"
                            color="tertiary"
                            aria-label="delete starter"
                            onClick={onDelete(index)}
                            sx={styles.deleteButton}
                          >
                            <DeleteIcon sx={styles.deleteIcon} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                );
              })}

              {!disabled && (
                <Tooltip
                  placement="top-start"
                  title={disableAdd ? 'You have reached the limit of conversation starters' : ''}
                  extraStyles={{ maxWidth: 400 }}
                >
                  <Box>
                    <AddItemButton
                      sx={styles.addButton}
                      disabled={disableAdd}
                      ref={addButtonRef}
                      onClick={disableAdd ? null : onAdd}
                      title="Starter"
                    />
                  </Box>
                </Tooltip>
              )}
            </>
          ),
        },
      ]}
    />
  );
});

/** @type {MuiSx} */
const conversationStartersStyles = () => ({
  accordionSX: ({ palette }) => ({ background: `${palette.background.tabPanel} !important` }),
  starterRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2.2rem',
  },
  inputWrapper: {
    width: '100%',
  },
  characterCount: {
    width: '100%',
  },
  deleteButtonWrapper: {
    paddingBottom: '0.5rem',
  },
  deleteButton: {
    marginLeft: 0,
  },
  deleteIcon: {
    fontSize: '1rem',
  },
  addButton: {
    marginTop: '0.75rem',
  },
});

ConversationStarters.displayName = 'ConversationStarters';

export default ConversationStarters;

export const EllipsisTextWithTooltip = memo(props => {
  const { text, onClick, sx, textSX } = props;

  const styles = ellipsisTextWithTooltipStyles();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const textRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    const isEllipsis =
      textRef.current.clientHeight < textRef.current.scrollHeight ||
      textRef.current.clientWidth < textRef.current.scrollWidth;
    setIsTooltipVisible(isEllipsis);
  }, [textRef, setIsTooltipVisible]);

  const handleMouseLeave = useCallback(() => {
    setIsTooltipVisible(false);
  }, [setIsTooltipVisible]);

  const TextComponent = (
    <Typography
      sx={[styles.ellipsisText, textSX]}
      ref={textRef}
      component="div"
      variant="bodyMedium"
      color="text.secondary"
    >
      {text}
    </Typography>
  );

  return (
    <Box
      sx={[styles.starterItem, sx]}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isTooltipVisible ? (
        <Tooltip
          placement="top"
          title={text}
          extraStyles={styles.tooltip}
        >
          {TextComponent}
        </Tooltip>
      ) : (
        TextComponent
      )}
    </Box>
  );
});

EllipsisTextWithTooltip.displayName = 'EllipsisTextWithTooltip';

/** @type {MuiSx} */
const ellipsisTextWithTooltipStyles = () => ({
  starterItem: ({ palette }) => ({
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    background: palette.background.conversationStarters.default,
    '&:hover': {
      background: palette.background.conversationStarters.hover,
    },
  }),
  ellipsisText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
  },
  tooltip: {
    maxWidth: '31.25rem',
  },
});

export const ConversationStartersView = memo(props => {
  const { items = [], onSend = () => {}, sx = {} } = props;

  const styles = conversationStartersViewStyles();
  const filteredItems = useMemo(() => items?.filter(starter => starter.trim()) || [], [items]);
  const handleClick = useCallback(
    starter => () => {
      onSend(starter);
    },
    [onSend],
  );

  return (
    <Box sx={[styles.container, { display: items.length > 0 ? 'flex' : 'none' }, sx]}>
      {filteredItems.length > 0 && (
        <>
          <ListItem sx={styles.titleListItem}>
            <Typography
              variant="bodyMedium"
              sx={styles.title}
            >
              You may start conversation from following:
            </Typography>
          </ListItem>
          {filteredItems.map((starter, index) =>
            starter ? (
              <ListItem
                key={index}
                sx={styles.starterListItem}
              >
                <EllipsisTextWithTooltip
                  text={starter}
                  onClick={handleClick(starter)}
                />
              </ListItem>
            ) : null,
          )}
        </>
      )}
    </Box>
  );
});

ConversationStartersView.displayName = 'ConversationStartersView';

/** @type {MuiSx} */
const conversationStartersViewStyles = () => ({
  container: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    height: 'auto',
    width: '100%',
    padding: '1rem 1rem 0.5rem 1rem',
    boxSizing: 'border-box',
  },
  titleListItem: {
    padding: ' 0.25rem 0',
  },
  title: ({ palette }) => ({
    color: palette.text.button.disabled,
  }),
  starterListItem: {
    padding: '0',
  },
});
