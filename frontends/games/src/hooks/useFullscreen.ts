import { useCallback, useEffect, useState } from 'react';

export const useFullscreen = (targetRef: React.RefObject<HTMLElement>) => {
  const [isFullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setFullscreen(document.fullscreenElement === targetRef.current);
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, [targetRef]);

  const request = useCallback(async () => {
    const target = targetRef.current;
    if (!target) return;

    try {
      await target.requestFullscreen({ navigationUI: 'hide' });
    } catch (error) {
      console.error('[useFullscreen] requestFullscreen failed', error);
    }
  }, [targetRef]);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('[useFullscreen] exitFullscreen failed', error);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) {
      void exit();
    } else {
      void request();
    }
  }, [exit, isFullscreen, request]);

  return {
    isFullscreen,
    request,
    exit,
    toggle
  };
};

export default useFullscreen;

