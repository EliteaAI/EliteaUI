import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useGetCurrentSurveysQuery, useSubmitSurveyResponseMutation } from '@/api';
import { eliteaApi } from '@/api/eliteaApi.js';

import { TAG_CURRENT_SURVEYS } from '../../api';
import { NPS_THANK_YOU_DELAY_MS, PHASE } from '../constants';
import { persistDismissedIds, readDismissedIds } from '../helpers';

const useNpsSurvey = () => {
  const dispatch = useDispatch();
  const thankYouTimerRef = useRef(null);

  const [phase, setPhase] = useState(PHASE.idle);
  const [answers, setAnswers] = useState(new Map());

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [dismissedIds, setDismissedIds] = useState(readDismissedIds);

  const { data: surveys = [] } = useGetCurrentSurveysQuery();
  const [submitSurveyResponse, { isLoading: isSubmitting }] = useSubmitSurveyResponseMutation();

  const activeSurvey = useMemo(
    () => surveys.find(s => !dismissedIds.includes(s.id)) ?? null,
    [surveys, dismissedIds],
  );

  const prevSurveyIdRef = useRef(activeSurvey?.id);

  const sortedQuestions = useMemo(
    () => (activeSurvey?.questions ?? []).slice().sort((a, b) => a.position - b.position),
    [activeSurvey],
  );

  const totalQuestions = sortedQuestions.length;
  const currentQuestion = sortedQuestions[currentQuestionIndex] ?? null;
  const selectedAnswer = currentQuestion ? (answers.get(currentQuestion.id) ?? null) : null;
  const allAnswered = totalQuestions > 0 && answers.size >= totalQuestions;

  useEffect(() => {
    if (phase === PHASE.thankyou) return;
    if (activeSurvey && phase === PHASE.idle) setPhase(PHASE.active);
    if (!activeSurvey && phase === PHASE.active) setPhase(PHASE.hidden);
  }, [activeSurvey, phase]);

  useEffect(() => {
    if (activeSurvey?.id === prevSurveyIdRef.current) return;

    prevSurveyIdRef.current = activeSurvey?.id;

    if (phase === PHASE.thankyou) return;

    setAnswers(new Map());
    setCurrentQuestionIndex(0);
  }, [activeSurvey?.id, phase]);

  useEffect(
    () => () => {
      if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
    },
    [],
  );

  const transitionAfterThankYou = useCallback(
    surveyId => {
      thankYouTimerRef.current = setTimeout(() => {
        setDismissedIds(prev => [...prev, surveyId]);
        setAnswers(new Map());
        setCurrentQuestionIndex(0);
        dispatch(eliteaApi.util.invalidateTags([TAG_CURRENT_SURVEYS]));
        setPhase(prev => {
          if (prev !== PHASE.thankyou) return prev;
          return PHASE.idle;
        });
      }, NPS_THANK_YOU_DELAY_MS);
    },
    [dispatch],
  );

  const handleSelectAnswer = useCallback(
    (questionId, answer) => {
      setAnswers(prev => {
        const next = new Map(prev);
        next.set(questionId, answer);
        return next;
      });

      setCurrentQuestionIndex(prev => {
        if (prev < sortedQuestions.length - 1) return prev + 1;

        return prev;
      });
    },
    [sortedQuestions],
  );

  const handleToggleCheckbox = useCallback((questionId, value) => {
    setAnswers(prev => {
      const next = new Map(prev);
      const current = Array.isArray(next.get(questionId)) ? [...next.get(questionId)] : [];
      const index = current.indexOf(value);

      if (index >= 0) current.splice(index, 1);
      else current.push(value);

      if (current.length > 0) next.set(questionId, current);
      else next.delete(questionId);

      return next;
    });
  }, []);

  const handleNextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => {
      if (prev < sortedQuestions.length - 1) return prev + 1;
      return prev;
    });
  }, [sortedQuestions]);

  const handleSubmit = useCallback(async () => {
    if (!activeSurvey || !allAnswered) return;

    const payload = sortedQuestions.map(q => ({
      question_id: q.id,
      answer: answers.get(q.id),
    }));

    try {
      await submitSurveyResponse({
        surveyId: activeSurvey.id,
        answers: payload,
      }).unwrap();

      setPhase(PHASE.thankyou);
      transitionAfterThankYou(activeSurvey.id);
    } catch {
      // mutation error — widget stays visible so user can retry
    }
  }, [activeSurvey, allAnswered, sortedQuestions, answers, submitSurveyResponse, transitionAfterThankYou]);

  const handleDismiss = useCallback(() => {
    if (!activeSurvey) return;

    const nextDismissed = [...dismissedIds, activeSurvey.id];
    setDismissedIds(nextDismissed);
    persistDismissedIds(nextDismissed);

    setAnswers(new Map());
    setCurrentQuestionIndex(0);

    const nextSurvey = surveys.find(s => !nextDismissed.includes(s.id)) ?? null;
    setPhase(nextSurvey ? PHASE.active : PHASE.hidden);
  }, [activeSurvey, dismissedIds, surveys]);

  return {
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
  };
};

export default useNpsSurvey;
