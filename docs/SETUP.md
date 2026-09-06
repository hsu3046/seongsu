# Setup and testing

## Requirements

Node.js 22.18 이상을 권장한다. Vite의 지원 범위와 별개로, 단위 테스트는 Node의 TypeScript 직접 실행을 사용한다. 최초 구현 검증 환경은 macOS, Node 25.8.2, npm 11.11.1이다.

루트 package.json을 확인하고 npm ci로 잠금 파일대로 설치한다.

## Commands

    npm run dev -- --port 5173 --strictPort
    npm run typecheck
    npm test
    npm run build
    npm run preview -- --port 4173 --strictPort

개발 서버는 기본적으로 로컬 컴퓨터의 127.0.0.1에서만 열린다. 공개 배포는 포함하지 않는다.

## Browser verification

tests/browser.mjs는 설치되어 있는 Playwright와 Chrome을 사용한다. 테스트를 위한 Playwright 패키지를 프로젝트에 자동 설치하지 않는다. 서버를 실행한 상태에서 기존 런타임의 패키지 경로를 지정한다.

    PLAYWRIGHT_MODULE_PATH=/path/to/existing/node_modules/playwright node tests/browser.mjs
    PLAYWRIGHT_MODULE_PATH=/path/to/existing/node_modules/playwright node tests/interaction.mjs
    PLAYWRIGHT_MODULE_PATH=/path/to/existing/node_modules/playwright node tests/fullscreen.mjs
    PLAYWRIGHT_MODULE_PATH=/path/to/existing/node_modules/playwright node tests/keyboard-entry.mjs

DEMO_URL로 테스트할 로컬 주소를 바꿀 수 있다. 결과와 스크린샷은 Git에서 제외된 artifacts/에 기록한다. 테스트는 별도 브라우저 컨텍스트를 사용하므로 사용자가 열어놓은 브라우저의 여권을 초기화하지 않는다.

## Manual checks

1. 처음 시작해 키보드 또는 터치 패드로 이동한다. 좌우로 걸을 때 옆모습과 교차하는 발·팔 동작을 확인한다.
2. 장소를 선택하고 자동 보행이 건물에 막히지 않는지 확인한다.
3. 도착 카드가 보이면 E 또는 Enter로 들어간다. 모바일에서는 카드를 탭한다. 도장을 받은 뒤 돌아오면 같은 위치인지 확인한다.
4. 밤·일본어로 바꾸고 새로고침해서 선택과 도장이 남는지 확인한다.
5. 다섯 장소를 완주하고 여권·즐겨찾기를 확인한다.
6. 모바일에서 방향 패드를 누른 채 영역 밖으로 이동하거나 손가락을 취소해도 이동이 멈추는지 확인한다.
7. 실제 iPhone 및 Android에서 렌더링·지속 성능을 별도 확인한다.
8. 전체 화면 진입·종료 후 캐릭터 위치와 페이지 스크롤이 유지되는지, 가로로 돌렸을 때 맵이 화면을 채우는지 확인한다.
9. 모바일 Map tools에서 시간대·확대·축소를 바꾸고 바깥을 탭해 닫는다. 전체 화면의 장소 진입·도장 수집도 확인한다.

## Fullscreen support

지원되는 브라우저에서는 Fullscreen API로 맵을 표시한다. API가 없거나 요청이 거절되면 브라우저 창을 채우는 보기로 전환하며 브라우저 주소창은 남을 수 있다. 같은 닫기 버튼으로 복귀한다. 실제 iOS Safari의 전체 화면·주소창·안전 영역 동작은 기기에서 별도로 확인해야 한다.

구현은 [MDN requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)과 [fullscreenchange](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event)를 참고했다.

## Real neighborhood data

현재 코스는 쎈느·디올·탬버린즈·대림창고·무신사다. 지도 API 키나 새 의존성 설치가 필요하지 않다. `src/data/map-source.json`의 데이터와 ODbL 출처 표시는 함께 유지한다. 매장을 바꿀 때 주소·출처·앵커·게임용 도착점을 함께 확인한다.

배포용 빌드 검증은 `npm run build` 후 실행한 로컬 preview 주소를 DEMO_URL로 지정한다. 테스트 도중 HMR의 영향을 받지 않도록 검증 중인 빌드를 다시 생성하지 않는다.
