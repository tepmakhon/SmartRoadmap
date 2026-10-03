import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
export function useData<T>(key: readonly unknown[], fn: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: key, queryFn: fn, enabled });
}
export function useAction<T, R>(
  fn: (data: T) => Promise<R>,
  message = 'Changes saved.',
  after?: (result: R) => void,
) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (result) => {
      await cache.invalidateQueries();
      if (message) toast.success(message);
      after?.(result);
    },
  });
}
export function useDebounced(value: string, delay = 300) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return result;
}
