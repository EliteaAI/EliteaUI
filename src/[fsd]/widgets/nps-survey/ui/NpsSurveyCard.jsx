import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Fade, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { QUESTION_TYPE } from '../lib/constants';
import CheckboxQuestion from './CheckboxQuestion';
import RadioQuestion from './RadioQuestion';
import ScoreButton from './ScoreButton';

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

  const isCheckboxType = displayedType === QUESTION_TYPE.checkbox;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const hasCheckboxSelection = isCheckboxType && Array.isArray(selectedAnswer) && selectedAnswer.length > 0;
  const showNext = isCheckboxType && !isLastQuestion;

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
      default: {
        const displayedOptions = displayedQuestion?.options;
        const displayedMin = displayedOptions?.min ?? 0;
        const displayedMax = displayedOptions?.max ?? 10;
        const displayedScores = Array.from({ length: displayedMax - displayedMin + 1 }, (_, i) => displayedMin + i);

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
            disabled={!hasCheckboxSelection}
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
const styles = {
  card: {
    position: 'relative',
    paddingTop: '1rem',
    paddingBottom: '1.5rem',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    borderRadius: '1rem',
    background: 'linear-gradient(to top, #f7d9ff, #d5e3fe)',
    border: '1px solid #93b2ff',
    width: '27.375rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  questionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: '#0E131D',
    textAlign: 'center',
    width: '100%',
  },
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
  label: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 500,
    fontSize: '0.625rem',
    lineHeight: '1rem',
    color: '#777A83',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    alignItems: 'center',
    width: '100%',
  },
  notNowBtn: {
    background: 'rgba(61, 68, 86, 0.1)',
    color: '#0E131D',
    '&:hover': {
      background: 'rgba(61, 68, 86, 0.15)',
    },
    '&:active': {
      background: 'rgba(61, 68, 86, 0.2)',
      border: 'none',
    },
  },
  submitBtn: {
    background: 'rgba(196, 40, 221, 1)',
    color: '#FFFFFF',
    '&:hover': {
      background: 'rgba(196, 40, 221, 0.85)',
    },
    '&:active': {
      background: 'rgba(196, 40, 221, 0.7)',
    },
    '&:disabled': {
      background: 'rgba(196, 40, 221, 0.4)',
      color: '#FFFFFF',
    },
  },
};

export default NpsSurveyCard;
