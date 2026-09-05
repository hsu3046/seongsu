import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { WorldController, WorldOptions } from '../game/world';
import type { PlaceId, TimeOfDay } from '../data/places';
import { getCopy } from '../data/copy';
import type { Locale } from '../data/places';
import { Icon } from './Icon';

interface Props extends Omit<WorldOptions, 'onError'> {
  paused: boolean;
  locale: Locale;
  controller: MutableRefObject<WorldController | null>;
}
export function WorldCanvas(props: Props) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const t = getCopy(props.locale);

  useEffect(() => {
    let disposed = false;
    let instance: WorldController | null = null;
    const parent = root.current!;
    setReady(false); setError(false);
    const synchronizePause = () => instance?.pause(latest.current.paused || document.hidden);
    const release = () => instance?.stop();
    const resize = new ResizeObserver(([entry]) => {
      if (entry) instance?.resize(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height));
    });
    resize.observe(parent);
    document.addEventListener('visibilitychange', synchronizePause);
    window.addEventListener('blur', release);
    const contextLost = (event: Event) => { event.preventDefault(); instance?.pause(true); setError(true); };
    parent.addEventListener('webglcontextlost', contextLost, true);
    import('../game/world').then(({ createWorld }) => {
      if (disposed) return;
      instance = createWorld(parent, {
        ...latest.current,
        onReady: () => {
          if (disposed) return;
          setReady(true);
          latest.current.onReady();
          instance?.setTime(latest.current.time);
          instance?.setVisited(latest.current.visited);
          instance?.enable(latest.current.enabled);
          if (latest.current.paused || document.hidden) synchronizePause();
        },
        onNear: (id) => !disposed && latest.current.onNear(id),
        onPosition: (position) => !disposed && latest.current.onPosition(position),
        onVisit: (id) => !disposed && latest.current.onVisit(id),
        onNavigating: (moving) => !disposed && latest.current.onNavigating(moving),
        onBlocked: () => !disposed && latest.current.onBlocked(),
        onError: () => !disposed && setError(true),
      });
      latest.current.controller.current = instance;
    }).catch(() => { if (!disposed) setError(true); });
    return () => {
      disposed = true;
      resize.disconnect();
      document.removeEventListener('visibilitychange', synchronizePause);
      window.removeEventListener('blur', release);
      parent.removeEventListener('webglcontextlost', contextLost, true);
      instance?.destroy();
      latest.current.controller.current = null;
    };
  }, [attempt]);

  useEffect(() => { props.controller.current?.pause(props.paused || document.hidden); }, [props.paused, props.controller]);
  useEffect(() => { props.controller.current?.enable(props.enabled); }, [props.enabled, props.controller]);
  useEffect(() => { props.controller.current?.setTime(props.time as TimeOfDay); }, [props.time, props.controller]);
  useEffect(() => { props.controller.current?.setVisited(props.visited as readonly PlaceId[]); }, [props.visited, props.controller]);

  return <>
    <div ref={root} className="world-canvas" role="img" aria-label={t.mapLabel} data-ready={ready ? 'true' : 'false'} />
    {(!ready || error) && <div className="world-loading" role="status">
      <Icon name={error ? 'compass' : 'passport'} size={38} />
      <p>{error ? t.gameError : t.loading}</p>
      {error && <button className="button primary" onClick={() => setAttempt((value) => value + 1)}>{t.retry}</button>}
    </div>}
  </>;
}
