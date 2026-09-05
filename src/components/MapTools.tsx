import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Locale, TimeOfDay } from '../data/places';
import type { WorldController } from '../game/world';
import { getCopy } from '../data/copy';
import { Icon } from './Icon';
import type { IconName } from './Icon';

const periods: { value: TimeOfDay; icon: IconName }[] = [
  { value: 'morning', icon: 'sunrise' }, { value: 'afternoon', icon: 'sun' }, { value: 'night', icon: 'moon' },
];

export function MapTools({ locale, time, onTime, controller, active, expanded }: {
  locale: Locale; time: TimeOfDay; onTime: (time: TimeOfDay) => void;
  controller: MutableRefObject<WorldController | null>; active: boolean; expanded: boolean;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const t = getCopy(locale);
  const close = () => { setOpen(false); toggle.current?.focus({ preventScroll: true }); };

  useEffect(() => { setOpen(false); }, [active, expanded]);

  return <div className={'map-tools ' + (open ? 'is-open' : '')} onKeyDown={(event) => {
    if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    {open && <div className="map-tools-backdrop" aria-hidden="true" onClick={close} />}
    <button ref={toggle} className="map-tool-toggle map-icon-control" aria-label={t.mapTools}
      aria-expanded={open} aria-controls="map-tools-panel" onClick={() => {
        controller.current?.stop();
        setOpen(!open);
      }}><Icon name={open ? 'close' : 'sliders'} size={17} /></button>
    <div className="map-tools-panel" id="map-tools-panel">
      <div className="time-switch" role="group" aria-label={t.timeLabel}>
        {periods.map((period) => <button key={period.value} aria-label={t[period.value]}
          aria-pressed={time === period.value} onClick={() => onTime(period.value)}>
          <Icon name={period.icon} size={15} /><span>{t[period.value]}</span>
        </button>)}
      </div>
      <div className="map-zoom">
        <button aria-label={t.zoomIn} onClick={() => controller.current?.zoom(.15)}><Icon name="plus" size={18} /></button>
        <button aria-label={t.zoomOut} onClick={() => controller.current?.zoom(-.15)}><Icon name="minus" size={18} /></button>
        <span /><button aria-label={t.recenter} onClick={() => controller.current?.recenter()}><Icon name="target" size={18} /></button>
      </div>
    </div>
  </div>;
}
