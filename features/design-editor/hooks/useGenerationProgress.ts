import { useState, useEffect, useRef, useCallback } from 'react';

const CREATE_STEPS = [
  { label: 'Understanding your request...', duration: 3000, target: 25 },
  { label: 'Designing layout...', duration: 5000, target: 50 },
  { label: 'Styling elements...', duration: 7000, target: 75 },
  { label: 'Finalizing design...', duration: Infinity, target: 92 },
] as const;

const EDIT_STEPS = [
  { label: 'Analyzing your design...', duration: 3000, target: 25 },
  { label: 'Applying changes...', duration: 5000, target: 50 },
  { label: 'Refining layout...', duration: 7000, target: 75 },
  { label: 'Finalizing updates...', duration: Infinity, target: 92 },
] as const;

const TICK_INTERVAL = 80;

export interface GenerationProgress {
  currentStepIndex: number;
  currentStep: string;
  progress: number;
  isComplete: boolean;
  totalSteps: number;
}

export function useGenerationProgress(isGenerating: boolean, isEditMode: boolean = false): GenerationProgress {
  const STEPS = isEditMode ? EDIT_STEPS : CREATE_STEPS;
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const prevGenerating = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepStartTime = useRef(0);
  const currentProgress = useRef(0);
  const currentStepIdx = useRef(0);
  const stepsRef = useRef(STEPS);
  stepsRef.current = STEPS;

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Detect transition: not generating -> generating (start)
    if (isGenerating && !prevGenerating.current) {
      setProgress(0);
      setStepIndex(0);
      setIsComplete(false);
      currentProgress.current = 0;
      currentStepIdx.current = 0;
      stepStartTime.current = Date.now();

      cleanup();
      intervalRef.current = setInterval(() => {
        const steps = stepsRef.current;
        const idx = currentStepIdx.current;
        const step = steps[idx];
        const elapsed = Date.now() - stepStartTime.current;

        if (idx < steps.length - 1) {
          const prevTarget = idx > 0 ? steps[idx - 1].target : 0;
          const range = step.target - prevTarget;
          const fraction = Math.min(elapsed / step.duration, 1);
          const newProgress = prevTarget + range * fraction;

          currentProgress.current = newProgress;
          setProgress(newProgress);

          if (fraction >= 1) {
            currentStepIdx.current = idx + 1;
            stepStartTime.current = Date.now();
            setStepIndex(idx + 1);
          }
        } else {
          const prevTarget = steps[idx - 1].target;
          const range = step.target - prevTarget;
          const tau = 15000;
          const fraction = 1 - Math.exp(-elapsed / tau);
          const newProgress = prevTarget + range * fraction;

          currentProgress.current = newProgress;
          setProgress(newProgress);
        }
      }, TICK_INTERVAL);
    }

    // Detect transition: generating -> not generating (complete)
    if (!isGenerating && prevGenerating.current) {
      cleanup();

      const startVal = currentProgress.current;
      const startTime = Date.now();
      const fillDuration = 400;

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const fraction = Math.min(elapsed / fillDuration, 1);
        const eased = 1 - Math.pow(1 - fraction, 3);
        const newProgress = startVal + (100 - startVal) * eased;

        currentProgress.current = newProgress;
        setProgress(newProgress);

        if (fraction >= 1) {
          cleanup();
          setIsComplete(true);
        }
      }, TICK_INTERVAL);
    }

    prevGenerating.current = isGenerating;
  }, [isGenerating, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    currentStepIndex: stepIndex,
    currentStep: STEPS[stepIndex]?.label ?? '',
    progress,
    isComplete,
    totalSteps: STEPS.length,
  };
}
