import { useEffect, useState } from 'react';
import type { RequestStatus } from '../types/weather';

export default function useMockWeather() {
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [request, setRequest] = useState<{ query: string } | null>(null);

  useEffect(() => {
    if (!request) return;

    const timer = window.setTimeout(() => {
      const command = request.query.toLocaleLowerCase('pt-BR');
      setStatus(command === 'vazio' ? 'empty' : command === 'erro' ? 'error' : 'success');
    }, 600);

    return () => window.clearTimeout(timer);
  }, [request]);

  function search(query: string) {
    setStatus('loading');
    setRequest({ query });
  }

  function retry() {
    if (request) search(request.query);
  }

  return { status, search, retry };
}
