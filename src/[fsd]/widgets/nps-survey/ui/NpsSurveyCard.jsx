import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Fade, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { QUESTION_TYPE } from '../lib/constants';
import CheckboxQuestion from './CheckboxQuestion';
import RadioQuestion from './RadioQuestion';
import ScoreButton from './ScoreButton';
import TextQuestion from './TextQuestion';

const NpsSurveyCard = memo(props => {
  const {
    survey,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedAnswer,
    allAnswered,
    isSubmitting,
    onSelectAnswer,
    onToggleCheckbox,
    onTextChange,
    onNextQuestion,
    onSubmit,
    onDismiss,
  } = props;
  const displayedQuestionRef = useRef(currentQuestion);

  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    if (currentQuestion?.id !== displayedQuestionRef.current?.id) {
      setFadeIn(false);
    }
  }, [currentQuestion]);

  const handleQuestionFadeOut = useCallback(() => {
    displayedQuestionRef.current = currentQuestion;
    setFadeIn(true);
  }, [currentQuestion]);

  const displayedQuestion = displayedQuestionRef.current;
  const displayedType = displayedQuestion?.question_type;

  const handleSelectScore = useCallback(
    score => onSelectAnswer(currentQuestion.id, score),
    [onSelectAnswer, currentQuestion.id],
  );

  const needsManualAdvance = displayedType === QUESTION_TYPE.checkbox || displayedType === QUESTION_TYPE.text;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const hasCurrentAnswer =
    displayedType === QUESTION_TYPE.checkbox
      ? Array.isArray(selectedAnswer) && selectedAnswer.length > 0
      : selectedAnswer != null;
  const showNext = needsManualAdvance && !isLastQuestion;

  const styles = npsSurveyCardStyles();

  const renderQuestionBody = () => {
    switch (displayedType) {
      case QUESTION_TYPE.radio:
        return (
          <RadioQuestion
            question={displayedQuestion}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        );
      case QUESTION_TYPE.checkbox:
        return (
          <CheckboxQuestion
            question={displayedQuestion}
            selectedAnswer={selectedAnswer}
            onToggleCheckbox={onToggleCheckbox}
          />
        );
      case QUESTION_TYPE.text:
        return (
          <TextQuestion
            question={displayedQuestion}
            selectedAnswer={selectedAnswer}
            onTextChange={onTextChange}
          />
        );
      default: {
        const displayedOptions = displayedQuestion?.options;
        const displayedMin = displayedOptions?.min ?? 0;
        const displayedMax = displayedOptions?.max ?? 10;
        const displayedScores = Array.from(
          { length: displayedMax - displayedMin + 1 },
          (_, i) => displayedMin + i,
        );

        return (
          <Box sx={styles.scoresSection}>
            <Box sx={styles.scoresRow}>
              {displayedScores.map(score => (
                <ScoreButton
                  key={score}
                  score={score}
                  isSelected={selectedAnswer === score}
                  onClick={handleSelectScore}
                />
              ))}
            </Box>
            <Box sx={styles.labelsRow}>
              <Typography sx={styles.label}>{displayedOptions?.min_label ?? 'Not likely'}</Typography>
              <Typography sx={styles.label}>{displayedOptions?.max_label ?? 'Very likely'}</Typography>
            </Box>
          </Box>
        );
      }
    }
  };

  return (
    <Box sx={styles.card}>
      <Fade
        in={fadeIn}
        timeout={300}
        onExited={handleQuestionFadeOut}
      >
        <Box sx={styles.questionContent}>
          <Typography sx={styles.title}>{displayedQuestion.title}</Typography>
        </Box>
      </Fade>

      <Fade
        in={fadeIn}
        timeout={300}
      >
        <Box>{renderQuestionBody()}</Box>
      </Fade>

      <Box sx={styles.actionsRow}>
        {survey.dismissible && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={onDismiss}
            sx={styles.notNowBtn}
          >
            Not now
          </Button.BaseBtn>
        )}
        {showNext && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={onNextQuestion}
            disabled={!hasCurrentAnswer}
            sx={styles.notNowBtn}
          >
            Next
          </Button.BaseBtn>
        )}
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          onClick={onSubmit}
          disabled={!allAnswered}
          loading={isSubmitting}
          sx={styles.submitBtn}
        >
          Submit
        </Button.BaseBtn>
      </Box>
    </Box>
  );
});

NpsSurveyCard.displayName = 'NpsSurveyCard';

/** @type {MuiSx} */
const npsSurveyCardStyles = () => ({
  card: ({ palette }) => ({
    position: 'relative',
    paddingTop: '1rem',
    paddingBottom: '1.5rem',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    borderRadius: '1rem',
    background: palette.background.npsCard,
    border: `0.0625rem solid ${palette.border.accent}`,
    width: '27.375rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  }),
  questionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: ({ palette }) => ({
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: palette.text.inverse,
    textAlign: 'center',
    width: '100%',
  }),
  scoresSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
  },
  scoresRow: {
    display: 'flex',
    gap: '0.25rem',
    flexWrap: 'wrap',
  },
  labelsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  label: ({ palette }) => ({
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 500,
    fontSize: '0.625rem',
    lineHeight: '1rem',
    color: palette.text.muted,
  }),
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    alignItems: 'center',
    width: '100%',
  },
  notNowBtn: ({ palette }) => ({
    background: palette.background.button.outline.default,
    color: palette.text.inverse,
    '&:hover': {
      background: palette.background.button.outline.hover,
    },
    '&:active': {
      background: palette.background.button.outline.pressed,
      border: 'none',
    },
  }),
  submitBtn: ({ palette }) => ({
    background: palette.background.button.accent.default,
    color: palette.text.onAccent,
    '&:hover': {
      background: palette.background.button.accent.hover,
    },
    '&:active': {
      background: palette.background.button.accent.pressed,
    },
    '&:disabled': {
      background: palette.background.button.accent.disabled,
      color: palette.text.onAccent,
    },
  }),
});

export default NpsSurveyCard;
