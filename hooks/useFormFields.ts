"use client";

import { useState, useEffect, useCallback } from "react";
import { JsmField } from "@/types/jsm";

interface UseFormFieldsProps {
  requestParamId: string | null;
  spaceParamId: string | null;
  setApiError: (err: string | null) => void;
}

export function useFormFields({
  requestParamId,
  spaceParamId,
  setApiError,
}: UseFormFieldsProps) {
  const [fields, setFields] = useState<JsmField[]>([]);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!requestParamId || !spaceParamId) {
      return;
    }

    let isCancelled = false;
    // Set loading state safely
    const timer = window.setTimeout(() => setFormLoading(true), 0);

    fetch(`/api/jsm/fields/${requestParamId}?serviceDeskId=${spaceParamId}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          fields?: JsmField[];
          formId?: string | null;
        };
        if (!isCancelled) {
          setFields(data.fields || []);
          setCurrentFormId(data.formId || null);
          setFormLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error("Failed to load form fields:", err);
          setApiError("Failed to load fields for this request.");
          setFormLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [requestParamId, spaceParamId, setApiError]);

  const reloadFields = useCallback(() => {
    if (requestParamId && spaceParamId) {
      setFormLoading(true);
      fetch(`/api/jsm/fields/${requestParamId}?serviceDeskId=${spaceParamId}`)
        .then(async (res) => {
          const data = (await res.json()) as {
            fields?: JsmField[];
            formId?: string | null;
          };
          setFields(data.fields || []);
          setCurrentFormId(data.formId || null);
        })
        .catch((err: unknown) => {
          console.error("Failed to reload form fields:", err);
          setApiError("Failed to reload fields for this request.");
        })
        .finally(() => setFormLoading(false));
    }
  }, [requestParamId, spaceParamId, setApiError]);

  return {
    fields,
    currentFormId,
    formLoading,
    setFormLoading,
    reloadFields,
  };
}
