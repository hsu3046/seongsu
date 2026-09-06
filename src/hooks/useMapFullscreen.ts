import { useCallback, useEffect, useRef, useState } from 'react';

// Keep the same canvas mounted in native fullscreen and the window-sized fallback.
export function useMapFullscreen(enabled: boolean) {
  const frame = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const wanted = useRef(false);
  const wasNative = useRef(false);
  const stillExploring = useRef(enabled);
  stillExploring.current = enabled;
  const [active, setActive] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [exitError, setExitError] = useState(false);

  const exit = useCallback(async () => {
    wanted.current = false;
    if (frame.current && document.fullscreenElement === frame.current) {
      try { await document.exitFullscreen(); }
      catch { setExitError(true); return; }
    }
    setActive(false);
    setExitError(false);
  }, []);

  const toggle = async () => {
    if (active) { await exit(); return; }
    const element = frame.current;
    if (!element) return;
    wanted.current = true;
    setActive(true);
    setFallback(false);
    setExitError(false);
    if (!document.fullscreenEnabled || !element.requestFullscreen) {
      setFallback(true);
      return;
    }
    try {
      await element.requestFullscreen();
      // A place can open while the browser is still processing the request.
      if (!wanted.current) await exit();
    } catch {
      if (wanted.current) setFallback(true);
    }
  };

  useEffect(() => {
    const synchronize = () => {
      const native = !!frame.current && document.fullscreenElement === frame.current;
      if (wasNative.current && !native) {
        wanted.current = false;
        setActive(false);
      }
      wasNative.current = native;
    };
    document.addEventListener('fullscreenchange', synchronize);
    return () => document.removeEventListener('fullscreenchange', synchronize);
  }, []);

  useEffect(() => { if (!enabled) void exit(); }, [enabled, exit]);

  useEffect(() => {
    if (!active) return;
    const { scrollX, scrollY } = window;
    const body = document.body;
    const previous = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow };
    Object.assign(body.style, { position: 'fixed', top: `-${scrollY}px`, left: `-${scrollX}px`, width: '100%', overflow: 'hidden' });
    const keys = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') void exit();
      if (event.key !== 'Tab') return;
      // The fallback must also keep keyboard focus with the visible game controls.
      const controls = Array.from(frame.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? [])
        .filter((control) => control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keys);
    return () => {
      document.removeEventListener('keydown', keys);
      Object.assign(body.style, previous);
      window.scrollTo({ left: stillExploring.current ? scrollX : 0, top: stillExploring.current ? scrollY : 0, behavior: 'instant' });
      if (stillExploring.current && button.current?.getClientRects().length) button.current.focus({ preventScroll: true });
    };
  }, [active, exit]);

  return { frame, button, active, fallback, exitError, toggle };
}
