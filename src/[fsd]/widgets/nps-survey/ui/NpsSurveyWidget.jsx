import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Fade } from '@mui/material';

import { PHASE } from '../lib/constants';
import { useNpsSurvey } from '../lib/hooks';
import NpsSurveyCard from './NpsSurveyCard';
import NpsSurveyThankYou from './NpsSurveyThankYou';

const FADE_TIMEOUT = 400;

const NpsSurveyWidget = memo(() => {
  const {
    activeSurvey,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedAnswer,
    allAnswered,
    phase,
    isSubmitting,
    handleSelectAnswer,
    handleToggleCheckbox,
    handleNextQuestion,
    handleSubmit,
    handleDismiss,
  } = useNpsSurvey();

  const isVisible = phase === PHASE.active || phase === PHASE.thankyou;

  const [contentVisible, setContentVisible] = useState(true);
  const [showingThankYou, setShowingThankYou] = useState(false);

  const surveyRef = useRef(null);
  const questionRef = useRef(null);
  const selectedAnswerRef = useRef(null);

  if (activeSurvey) surveyRef.current = activeSurvey;
  if (currentQuestion) questionRef.current = currentQuestion;
  if (contentVisible) selectedAnswerRef.current = selectedAnswer;

  useEffect(() => {
    if (phase === PHASE.thankyou && !showingThankYou) setContentVisible(false);

    if (phase === PHASE.active) {
      setShowingThankYou(false);
      setContentVisible(true);
    }
  }, [phase, showingThankYou]);

  const handleContentExited = useCallback(() => {
    if (phase === PHASE.thankyou) {
      setShowingThankYou(true);
      setContentVisible(true);
    }
  }, [phase]);

  return (
    <Fade
      in={isVisible}
      timeout={FADE_TIMEOUT}
      unmountOnExit
    >
      <Box sx={styles.container}>
        <Fade
          in={contentVisible}
          timeout={FADE_TIMEOUT}
          onExited={handleContentExited}
        >
          <Box>
            {showingThankYou ? (
              <NpsSurveyThankYou />
            ) : (
              surveyRef.current &&
              questionRef.current && (
                <NpsSurveyCard
                  survey={surveyRef.current}
                  currentQuestion={questionRef.current}
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={totalQuestions}
                  selectedAnswer={selectedAnswerRef.current}
                  allAnswered={allAnswered}
                  isSubmitting={isSubmitting}
                  onSelectAnswer={handleSelectAnswer}
                  onToggleCheckbox={handleToggleCheckbox}
                  onNextQuestion={handleNextQuestion}
                  onSubmit={handleSubmit}
                  onDismiss={handleDismiss}
                />
              )
            )}
          </Box>
        </Fade>
      </Box>
    </Fade>
  );
});

NpsSurveyWidget.displayName = 'NpsSurveyWidget';

/** @type {MuiSx} */
const styles = {
  container: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    zIndex: 1300,
  },
};

export default NpsSurveyWidget;
