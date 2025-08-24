// Custom hook for API calls with loading states
import { useState, useEffect, useCallback } from "react";
import { ApiError } from "../api/index.js";

// Hook for handling async API calls with loading and error states
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(...args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("API call failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
};

// Hook for manual API calls (doesn't auto-execute)
export const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(...args);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("API call failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute, clearError: () => setError(null) };
};

// Hook for managing form submissions to API
export const useApiForm = (submitFunction) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(
    async (formData) => {
      try {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        const result = await submitFunction(formData);
        setSuccess(true);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError ? err.message : "Submission failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitFunction]
  );

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  }, []);

  return { isSubmitting, error, success, submit, reset };
};
