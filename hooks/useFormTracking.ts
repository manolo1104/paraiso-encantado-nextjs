'use client';

import { useCallback, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

export function useFormTracking(formName: string) {
  const fieldStartTimes = useRef<Record<string, number>>({});
  const completedFields = useRef(new Set<string>());

  const onFocus = useCallback((fieldName: string) => {
    fieldStartTimes.current[fieldName] = Date.now();
  }, []);

  const onBlur = useCallback(
    (fieldName: string, value: string) => {
      if (value.trim() && !completedFields.current.has(fieldName)) {
        completedFields.current.add(fieldName);
        const timeSpent = fieldStartTimes.current[fieldName]
          ? Math.round((Date.now() - fieldStartTimes.current[fieldName]) / 1000)
          : 0;
        trackEvent('FORM_FIELD_COMPLETE', { form: formName, field: fieldName, timeSpent });
      }
    },
    [formName]
  );

  const onError = useCallback(
    (fieldName: string, errorMsg: string) => {
      trackEvent('FORM_ERROR', { form: formName, field: fieldName, error: errorMsg });
    },
    [formName]
  );

  return { onFocus, onBlur, onError };
}
