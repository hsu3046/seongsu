# Seongsu Passport

A little Seoul. A lot to discover.

성수의 붉은벽돌 골목에서 영감을 얻은 **브라우저 플레이 데모**입니다. 작은 도트 마을을 걷고, 다섯 장소의 이야기를 읽고, 가상 방문 도장을 모아 여권을 완성합니다.

## Run

Node.js 22.18+ 권장. 처음 설치할 때 프로젝트 루트에서 실행합니다.

    npm ci
    npm run dev

개발 서버가 출력하는 로컬 주소를 엽니다. 기본 포트는 5173입니다.

    npm run typecheck
    npm test
    npm run build
    npm run preview

## Explore

- **Let’s take a walk**로 시작합니다.
- WASD / 방향키, 도로 클릭 또는 모바일 방향 패드로 이동합니다.
- 오른쪽 코스에서 장소를 누르거나 **Walk here**를 누르면 건물을 피해 자동으로 걸어갑니다.
- 가까이 도착하면 **Step inside** 또는 Enter로 장소를 엽니다.
- **Stamp my passport**로 가상 방문 도장을 받습니다. 다섯 장소를 방문하면 완주 화면이 열립니다.
- 시간대·EN/JA·즐겨찾기·진행도는 브라우저에 저장됩니다.

## Scope

React 19 · TypeScript · Vite 8 · Phaser 3.90. 모든 픽셀 아트는 이 프로젝트에서 Canvas로 직접 그립니다. 서버 API·계정·외부 이미지·실시간 위치정보는 사용하지 않습니다.

장소와 지도는 **가상의 데모 콘텐츠**입니다. 실제 지도 재현이나 영업정보가 아닙니다. 사진 영역은 준비 상태이며 실제 사진·3D 투어는 포함하지 않습니다. 오프라인 재로딩을 위한 서비스 워커도 포함하지 않습니다.

## Documentation

- [구현 제안](docs/UI_DEMO_PLAN.md)
- [구조와 책임](docs/ARCHITECTURE.md)
- [실행 및 검증](docs/SETUP.md)
- [상태·엔진 인터페이스](docs/API.md)
- [선택한 범위와 이유](docs/DECISIONS.md)
- [자산 출처와 라이선스](docs/ASSETS.md)
- [검증 기록](docs/VALIDATION.md)

## License

Copyright © 2026 KnowAI — https://knowai.space

GNU General Public License v3.0 only. See [LICENSE](LICENSE). Third-party packages and fonts retain their respective licenses.
