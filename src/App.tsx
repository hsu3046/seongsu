import { useEffect, useRef, useState } from 'react';
import { places, findPlace } from './data/places';
import type { Locale, Place, PlaceId } from './data/places';
import { getCopy } from './data/copy';
import { collectStamp, decodeProgress, freshProgress, STORAGE_KEY, toggleSaved } from './state/progress';
import type { WorldController, Direction } from './game/world';
import { placePreview } from './game/art';
import { Icon } from './components/Icon';
import { WorldCanvas } from './components/WorldCanvas';
import { MapTools } from './components/MapTools';
import { useMapFullscreen } from './hooks/useMapFullscreen';
import './styles.css';

type View = 'explore' | 'detail' | 'passport' | 'complete' | 'about';

function Stamp({ place, collected, large = false }: { place: Place; collected: boolean; large?: boolean }) {
  return <div className={'stamp ' + (collected ? 'is-collected ' : '') + (large ? 'stamp-large' : '')} style={{ '--stamp-color': place.color } as React.CSSProperties}>
    <span className="stamp-top">SEONGSU PASSPORT</span>
    <Icon name={place.kind} size={large ? 35 : 23} />
    <span className="stamp-bottom">{collected ? place.name.toUpperCase() : place.number + ' / 05'}</span>
    {collected && <span className="stamp-check"><Icon name="check" size={10} /></span>}
  </div>;
}

function Wordmark() {
  return <span className="wordmark">
    <span className="brand-icon"><Icon name="passport" size={27} /></span>
    <span>seongsu<span className="wordmark-sub">P A S S P O R T</span></span>
  </span>;
}

function PhotoJournal({ place, locale }: { place: Place; locale: Locale }) {
  const [photo, setPhoto] = useState(0);
  const t = getCopy(locale);
  return <div className="photo-journal" style={{ '--place-tint': place.tint, '--place-color': place.color } as React.CSSProperties}>
    <div className="photo-heading"><span className="eyebrow">{t.photos}</span><span>0{photo + 1} / 02</span></div>
    <div className="photo-placeholder" aria-label={t.photoNote}>
      <span className="crop corner-tl" /><span className="crop corner-tr" /><span className="crop corner-bl" /><span className="crop corner-br" />
      <svg className="architecture-sketch" viewBox="0 0 400 280" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        {photo === 0 ? <>
          <path d="M38 238h326M79 238V89l23-22h197l24 22v149M74 91h256M80 151h245M100 67V50h196v17M102 238v-63h48v63m99 0v-63h49v63M176 238v-67a24 24 0 0 1 48 0v67m-24-90v90M92 116h219" />
          <path d="M109 105h17m14 0h17m14 0h17m14 0h17m14 0h17m14 0h17M111 196h30m-15-20v57m132-37h30m-15-20v57M200 181v-14M166 143h68" />
          <path d="M48 238v-36m0 7c-25-4-15-32 0-17 15-20 30 6 0 17M347 238v-51m0 18c-32-7-19-45 0-24 20-26 38 10 0 24M320 231h17v-27h-17v27" />
        </> : <>
          <path d="M42 238h318M75 238V63h247v175M88 75h221v142H88V75M153 217v-94a47 47 0 0 1 94 0v94M197 79v137M155 128h92M79 231h242M116 217v-37m0 13c-33-10-26-49 0-23 27-29 31 15 0 23M283 217v-42m0 20c-36-9-27-50 0-27 24-32 40 16 0 27" />
          <path d="M160 194h76m-61 0v43m47-43v43M132 207v28m-7-28h17m99 0h22m-10 0v28M179 185h12v9h-12v-9m32 0h12v9h-12v-9M88 85h46v52H88m14-52v52" />
        </>}
      </svg>
      <h3>{t.photoSoon}</h3>
      <p>{t.photoNote}</p>
      <span className="photo-location">{place.localName} <span>·</span> SEONGSU</span>
    </div>
    <div className="photo-tabs" aria-label={t.photos}>
      <button aria-pressed={photo === 0} onClick={() => setPhoto(0)}><span>01</span>{t.exterior}</button>
      <button aria-pressed={photo === 1} onClick={() => setPhoto(1)}><span>02</span>{t.inside}</button>
    </div>
  </div>;
}

export default function App() {
  const [progress, setProgress] = useState(() => {
    try { return decodeProgress(window.localStorage.getItem(STORAGE_KEY)); }
    catch { return freshProgress(); }
  });
  const [view, setView] = useState<View>('explore');
  const [selected, setSelected] = useState<PlaceId>('brick');
  const [detailId, setDetailId] = useState<PlaceId>('brick');
  const [nearby, setNearby] = useState<PlaceId | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const controller = useRef<WorldController | null>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const t = getCopy(progress.locale);
  const completed = progress.visited.length === places.length;
  const currentPlace = findPlace(selected);
  const detailPlace = findPlace(detailId);
  const paused = view !== 'explore' || confirmReset;
  const fullscreen = useMapFullscreen(view === 'explore');

  useEffect(() => {
    document.documentElement.lang = progress.locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [progress]);

  useEffect(() => {
    if (confirmReset) resetDialog.current?.showModal();
    else resetDialog.current?.close();
  }, [confirmReset]);

  useEffect(() => {
    if (view !== 'explore') {
      document.querySelector<HTMLElement>('[data-view="' + view + '"] .view-heading')?.focus();
      window.scrollTo({ top: 0 });
    } else if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
  }, [view]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const notify = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  };
  const show = (next: View) => {
    if (view === 'explore') returnFocus.current = document.activeElement as HTMLElement;
    setView(next);
  };
  const openPlace = (id: PlaceId) => { controller.current?.stop(); setDetailId(id); show('detail'); };
  const startWalk = () => {
    setProgress((previous) => ({ ...previous, started: true }));
    controller.current?.enable(true);
  };
  const walkTo = (place: Place) => {
    setSelected(place.id);
    if (!progress.started) startWalk();
    setView('explore');
    // The controller is enabled and resumed before issuing a navigation command.
    controller.current?.enable(true);
    controller.current?.pause(false);
    controller.current?.navigate(place.entrance);
    if (window.innerWidth <= 600) {
      requestAnimationFrame(() => document.querySelector('.map-frame')?.scrollIntoView({
        block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      }));
    }
  };
  const stampPlace = () => {
    const next = collectStamp(progress, detailId, nearby);
    if (next === progress) return;
    setProgress((previous) => collectStamp(previous, detailId, nearby));
    if (next.visited.length === places.length) setView('complete');
    else notify(t.stamped);
  };
  const reset = () => {
    controller.current?.reset();
    setProgress({ ...freshProgress(), locale: progress.locale });
    setSelected('brick'); setNearby(null); setNavigating(false);
    setConfirmReset(false); setView('explore');
  };
  const goPassport = () => show('passport');

  return <div className={'app locale-' + progress.locale + (fullscreen.active ? ' map-expanded' : '')} data-current-view={view}>
    <header className="site-header" inert={fullscreen.active}>
      <button className="brand-button" onClick={() => show('explore')} aria-label="Seongsu Passport"><Wordmark /></button>
      <nav className="main-nav" aria-label={progress.locale === 'en' ? 'Main navigation' : 'メインナビゲーション'}>
        <button className={view === 'explore' ? 'active' : ''} aria-current={view === 'explore' ? 'page' : undefined} onClick={() => show('explore')}><Icon name="compass" size={17} />{t.explore}</button>
        <button className={view === 'passport' || view === 'complete' ? 'active' : ''} onClick={goPassport}><Icon name="passport" size={17} />{t.passport}{progress.visited.length > 0 && <span className="nav-count">{progress.visited.length}</span>}</button>
      </nav>
      <div className="header-right">
        <div className="language-toggle" role="group" aria-label={t.language}>
          <button lang="en" aria-pressed={progress.locale === 'en'} onClick={() => setProgress((p) => ({ ...p, locale: 'en' }))}>EN</button>
          <span />
          <button lang="ja" aria-pressed={progress.locale === 'ja'} onClick={() => setProgress((p) => ({ ...p, locale: 'ja' }))}>日本語</button>
        </div>
        <button className="icon-button help-button" aria-label={t.help} onClick={() => show('about')}><Icon name="help" size={20} /></button>
      </div>
    </header>

    <main>
      <section className="explore-page page" data-view="explore" hidden={view !== 'explore'}>
        <div className="hero" inert={fullscreen.active}>
          <div><p className="eyebrow"><span className="small-star">✳</span>{t.eyebrow}</p>
            <h1>{t.heroFirst} <em>{t.heroSecond}</em></h1>
            <p className="hero-description">{t.heroNote}</p>
          </div>
          <div className="hero-seal" aria-hidden="true"><span>SEOUL LOCAL CLUB</span><Icon name="footsteps" size={30} /><span>TAKE IT SLOW</span></div>
        </div>
        <div className="experience">
          <div className="map-column">
            <div ref={fullscreen.frame} className={'map-frame time-' + progress.time + (fullscreen.active ? ' is-fullscreen' : '')} data-testid="map-frame">
              <WorldCanvas controller={controller} position={progress.position} time={progress.time} visited={progress.visited}
                enabled={progress.started} paused={paused} locale={progress.locale}
                onReady={() => setReady(true)} onNear={setNearby}
                onPosition={(position) => setProgress((p) => Math.abs(p.position.x - position.x) + Math.abs(p.position.y - position.y) < 1 ? p : { ...p, position })}
                onVisit={openPlace} onNavigating={setNavigating} onBlocked={() => notify(t.offPath)} />
              <div className="map-address"><span className="map-live-dot" /><div><b>{t.mapTop}</b><span>{t.mapSub}</span></div></div>
              <button ref={fullscreen.button} className="map-fullscreen-toggle map-icon-control"
                aria-label={fullscreen.active ? t.exitFullscreen : t.fullscreen} title={fullscreen.active ? t.exitFullscreen : t.fullscreen}
                aria-pressed={fullscreen.active} onClick={() => { controller.current?.stop(); void fullscreen.toggle(); }}>
                <Icon name={fullscreen.active ? 'contract' : 'expand'} size={18} />
              </button>
              <MapTools controller={controller} locale={progress.locale} time={progress.time} active={view === 'explore'} expanded={fullscreen.active}
                onTime={(time) => setProgress((p) => ({ ...p, time }))} />
              {fullscreen.active && fullscreen.fallback && <span className="sr-only" role="status">{t.fullscreenFallback}</span>}
              {fullscreen.active && fullscreen.exitError && <p className="fullscreen-error" role="alert">{t.fullscreenError}</p>}
              {!progress.started && ready && <div className="welcome-card">
                <span className="eyebrow"><Icon name="spark" size={13} />SEONGSU, AT YOUR OWN PACE</span>
                <h2>{t.welcome}</h2><p>{t.startNote}</p>
                <button className="button primary" onClick={startWalk}>{t.start}<Icon name="arrow" size={18} /></button>
              </div>}
              {progress.started && nearby && <button className="arrival-button" onClick={() => openPlace(nearby)}>
                <span className="arrival-icon"><Icon name={findPlace(nearby).kind} size={22} /></span>
                <span><small>{t.visit}</small><strong>{findPlace(nearby).name}</strong></span><Icon name="arrow" size={20} />
              </button>}
              {progress.started && navigating && !nearby && <button className="walking-badge" onClick={() => controller.current?.stop()}><span className="walking-dot" />{t.walking}<Icon name="close" size={14} /><span className="sr-only">{t.stopWalking}</span></button>}
              {progress.started && <div className="direction-pad" role="group" aria-label={t.mapLabel}>
                {(['up', 'left', 'right', 'down'] as const).map((direction: Direction) => <button
                  key={direction} className={'direction-' + direction}
                  aria-label={direction === 'up' ? t.moveUp : direction === 'down' ? t.moveDown : direction === 'left' ? t.moveLeft : t.moveRight}
                  onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); controller.current?.move(direction); }}
                  onPointerUp={() => controller.current?.move(null)} onPointerCancel={() => controller.current?.move(null)}
                  onLostPointerCapture={() => controller.current?.move(null)}
                  onKeyDown={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); controller.current?.move(direction); } }}
                  onKeyUp={() => controller.current?.move(null)} onBlur={() => controller.current?.move(null)}
                ><Icon name="arrow" size={20} /></button>)}
                <span className="pad-center" />
              </div>}
              <div className="map-coordinate" aria-hidden="true">37°32′ N &nbsp; 127°03′ E</div>
            </div>
            <div className="map-caption" inert={fullscreen.active}>
              <div className="map-legend"><span><i className="you-dot" />{t.you}</span><span><i className="coffee-dot" />{t.coffee}</span><span><i className="shop-dot" />{t.objects}</span><span><i className="green-dot" />{t.green}</span></div>
              <span className="desktop-hint"><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd><span>{t.clickHint}</span></span>
              <span className="mobile-hint">{t.touchHint}</span>
            </div>
            <nav className="map-navigation" aria-label={t.explore} inert={fullscreen.active}>
              <button aria-current="page" onClick={() => show('explore')}><Icon name="compass" size={16} />{t.explore}</button>
              <button onClick={goPassport}><Icon name="passport" size={16} />{t.passport}<span>{progress.visited.length} / 5</span></button>
            </nav>
          </div>

          <aside className="route-panel" aria-label={t.yourRoute} inert={fullscreen.active}>
            <div className="route-cover">
              <div className="eyebrow"><span className="route-dot" />{t.routeTag}<span className="route-number">NO. 01</span></div>
              <h2>{t.routeName}<span className="hand-spark" aria-hidden="true">✳</span></h2>
              <p>{t.routeSubtitle}</p>
              <div className="route-meta"><span><Icon name="pin" size={13} />{t.stopCount}</span><span><Icon name="clock" size={13} />{t.duration}</span></div>
            </div>
            <div className="route-list-heading"><span>{t.yourRoute}</span><span>01—05</span></div>
            <ol className="route-list">
              {places.map((place) => <li key={place.id} className={(selected === place.id ? 'selected ' : '') + (progress.visited.includes(place.id) ? 'visited' : '')}>
                <button className="route-place" onClick={() => { setSelected(place.id); if (progress.started) walkTo(place); }} aria-label={t.guide + ' · ' + place.name} aria-pressed={selected === place.id}>
                  <span className="route-index">{progress.visited.includes(place.id) ? <Icon name="check" size={12} /> : place.number}</span>
                  <img src={placePreview(place)} alt="" className="place-thumbnail" />
                  <span className="place-copy"><strong>{place.name}</strong><small>{place.category[progress.locale]}</small></span>
                  <Icon name="chevron" size={15} />
                </button>
              </li>)}
            </ol>
            {progress.started && <div className="route-action">
              <button className="button route-guide" onClick={() => nearby === selected ? openPlace(selected) : walkTo(currentPlace)}><Icon name={nearby === selected ? currentPlace.kind : 'footsteps'} size={17} />{nearby === selected ? t.visit : t.guide}<Icon name="arrow" size={16} /></button>
              <button className="text-button" onClick={() => openPlace(selected)}>{t.view}<Icon name="chevron" size={13} /></button>
            </div>}
            <div className="passport-peek">
              <div className="peek-header"><span><Icon name="passport" size={16} />{t.passport}</span><strong>{progress.visited.length}<span> / 5</span></strong></div>
              <div className="mini-stamps">{places.map((place) => <Stamp key={place.id} place={place} collected={progress.visited.includes(place.id)} />)}</div>
              <button className="peek-link" onClick={goPassport}>{completed ? t.routeComplete : progress.started ? t.seePassport : t.firstDiscovery}<Icon name="arrow" size={15} /></button>
            </div>
          </aside>
        </div>
      </section>

      {view === 'detail' && <section className="detail-page page secondary-page" data-view="detail">
        <button className="back-button" onClick={() => show('explore')}><Icon name="arrow" size={17} />{t.back}</button>
        <div className="detail-grid">
          <PhotoJournal key={detailId} place={detailPlace} locale={progress.locale} />
          <article className="place-article">
            <div className="eyebrow"><span className="location-number">{detailPlace.number}</span>{detailPlace.category[progress.locale]}</div>
            <h1 className="view-heading" tabIndex={-1}>{detailPlace.name}</h1>
            <div className="local-name">{detailPlace.localName}<span>SEONGSU-DONG</span></div>
            <p className="place-intro">{detailPlace.note[progress.locale]}</p>
            <div className="story"><h2 className="eyebrow">{t.placeStory}</h2><p>{detailPlace.description[progress.locale]}</p><p>{detailPlace.detail[progress.locale]}</p></div>
            <div className="moment"><Icon name="sun" size={22} /><div><span className="eyebrow">{t.favoriteMoment}</span><p>{detailPlace.moment[progress.locale]}</p></div></div>
            <div className="detail-actions">
              {progress.visited.includes(detailId)
                ? <div className="collected-message"><Icon name="check" size={20} />{t.stamped}</div>
                : nearby === detailId && progress.started
                  ? <button className="button primary" onClick={stampPlace}><Icon name="passport" size={20} />{t.collect}<Icon name="plus" size={17} /></button>
                  : <button className="button primary" onClick={() => walkTo(detailPlace)}><Icon name="footsteps" size={20} />{t.visitFirst}<Icon name="arrow" size={17} /></button>}
              <button className={'button save-button ' + (progress.saved.includes(detailId) ? 'is-saved' : '')} aria-pressed={progress.saved.includes(detailId)} onClick={() => setProgress((p) => toggleSaved(p, detailId))}><Icon name="bookmark" size={17} />{progress.saved.includes(detailId) ? t.saved : t.save}</button>
            </div>
            <p className="sample-note"><Icon name="compass" size={12} />{t.samplePlace}</p>
          </article>
        </div>
      </section>}

      {view === 'passport' && <section className="passport-page page secondary-page" data-view="passport">
        <button className="back-button" onClick={() => show('explore')}><Icon name="arrow" size={17} />{t.back}</button>
        <div className="passport-title"><span className="eyebrow">{t.passportEyebrow}</span><h1 className="view-heading" tabIndex={-1}>{t.passportTitle}</h1><p>{t.passportNote}</p></div>
        <div className="passport-book">
          <div className="book-spine" />
          <div className="passport-identity"><Wordmark /><span className="eyebrow">{t.issued}</span><div className="passport-avatar"><span>✳</span><Icon name="footsteps" size={45} /></div><span className="eyebrow">{t.traveler}</span><h2>{t.routeName}</h2><div className="identity-count"><strong>{progress.visited.length}</strong><span>/ 05<br />{t.virtualStamps}</span></div><div className="passport-barcode" aria-hidden="true" /><small>SSP &lt; SEOUL &lt; YOUR &lt; LITTLE &lt; STORY</small></div>
          <div className="passport-collection"><div className="book-page-title"><span>{t.page}</span><Icon name="spark" size={17} /></div><div className="stamp-grid">
            {places.map((place) => <button key={place.id} className="passport-stamp-button" onClick={() => openPlace(place.id)} aria-label={place.name + ' · ' + (progress.visited.includes(place.id) ? t.stamped : t.waiting)}><Stamp place={place} collected={progress.visited.includes(place.id)} large /><strong>{place.name}</strong><span>{progress.visited.includes(place.id) ? t.stamped : t.waiting}</span></button>)}
            <div className="stamp-grid-note"><Icon name="spark" size={24} /><p>{completed ? t.routeCompleteNote : t.startNote}</p></div>
          </div><div className="passport-progress"><span style={{ width: String(progress.visited.length / 5 * 100) + '%' }} /></div><span className="book-page-footer">SEOUL, SOUTH KOREA <span>01</span></span></div>
        </div>
        <div className="saved-places"><h2><Icon name="bookmark" size={19} />{t.viewSaved}<span>{progress.saved.length}</span></h2>
          {progress.saved.length === 0 ? <p>{t.noSaved}</p> : <div className="saved-list">{progress.saved.map((id) => <button key={id} onClick={() => openPlace(id)}><img src={placePreview(findPlace(id))} alt="" /><span>{findPlace(id).name}</span><Icon name="arrow" size={17} /></button>)}</div>}
        </div>
        <div className="passport-bottom"><span><Icon name="passport" size={15} />{t.privacy}</span><button className="text-button" onClick={() => setConfirmReset(true)}><Icon name="reset" size={14} />{t.reset}</button></div>
      </section>}

      {view === 'complete' && <section className="complete-page page secondary-page" data-view="complete">
        <div className="complete-stars" aria-hidden="true">✳ <span>✦</span> ✳</div>
        <div className="eyebrow">{t.completed}</div><h1 className="view-heading" tabIndex={-1}>{t.completeTitle}</h1><p>{t.completeNote}</p>
        <div className="explorer-badge"><span>SEONGSU PASSPORT</span><Icon name="footsteps" size={56} /><strong>SLOW<br />EXPLORER</strong><span>COFFEE & BRICK · NO. 01</span></div>
        <div className="complete-stamps">{places.map((place) => <Stamp key={place.id} place={place} collected />)}</div>
        <button className="button primary" onClick={goPassport}>{t.seePassport}<Icon name="arrow" size={18} /></button>
        <button className="text-button" onClick={() => show('explore')}>{t.continueExploring}</button>
      </section>}

      {view === 'about' && <section className="about-page page secondary-page" data-view="about">
        <button className="back-button" onClick={() => show('explore')}><Icon name="arrow" size={17} />{t.back}</button>
        <div className="about-layout"><div className="about-cover"><Icon name="passport" size={70} /><span>SEONGSU<br />PASSPORT</span><p>A LITTLE SEOUL.<br />A LOT TO DISCOVER.</p><Icon name="spark" size={25} /></div>
          <article><span className="eyebrow">{t.about}</span><h1 className="view-heading" tabIndex={-1}>{t.aboutTitle}</h1><p>{t.aboutText}</p><h2 className="eyebrow">{t.controlsTitle}</h2><p>{t.controlsText}</p><div className="about-note"><Icon name="compass" size={25} /><p>{t.demoText}</p></div><p className="about-privacy">{t.privacy}</p><button className="button primary" onClick={() => { startWalk(); show('explore'); }}>{progress.started ? t.continue : t.start}<Icon name="arrow" size={18} /></button></article></div>
      </section>}
    </main>
    <footer className="site-footer" inert={fullscreen.active}><span><Icon name="spark" size={13} />{t.footer}</span><span>{t.footerRight}</span></footer>
    {saveError && <div className="storage-notice" role="status">{t.saveError}</div>}
    <div className={'toast ' + (toast ? 'visible' : '')} role="status" aria-live="polite">{toast && <><Icon name="spark" size={16} />{toast}</>}</div>
    <dialog ref={resetDialog} className="reset-dialog" aria-labelledby="reset-heading" onCancel={() => setConfirmReset(false)}>
      <Icon name="passport" size={37} /><h2 id="reset-heading">{t.resetTitle}</h2><p>{t.resetNote}</p>
      <div><button className="button primary" onClick={() => setConfirmReset(false)}>{t.cancel}</button><button className="button" onClick={reset}>{t.confirmReset}</button></div>
    </dialog>
  </div>;
}
