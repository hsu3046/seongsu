# State and engine interfaces

외부 HTTP API는 없다. 환경 변수와 비밀키도 필요하지 않다.

저장 키: `seongsu-passport:yeonmujang:v1`. 기존 가상 코스의 키는 보존한다.

## Progress v1

| 필드 | 값 |
|---|---|
| version | 1 |
| started | 산책 시작 여부 |
| visited | 중복 없는 장소 ID 배열 |
| saved | 즐겨찾기 장소 ID 배열 |
| locale | en / ja |
| time | morning / afternoon / night |
| position | 유한한 월드 좌표 x, y |

장소 ID는 scene, dior, tamburins, daelim, musinsa이다.

collectStamp(progress, id, nearby)는 시작된 산책에서 id와 nearby가 같을 때만 새 도장을 추가한다. 중복 방문이나 원격 열람은 진행도를 바꾸지 않는다. 브라우저 데모의 진행 규칙이며 서버 인증이나 실제 방문 증명 수단은 아니다.

## UI → engine

- enable: 사용자 이동 활성화.
- pause: 입력 해제와 물리·프레임 루프 정지/복귀.
- move: 터치 패드의 방향 입력 또는 해제.
- navigate: 충돌을 피하는 경로 설정.
- stop: 자동 이동·키보드·터치 입력 해제.
- setTime, setVisited: 시각 상태 동기화.
- resize, zoom, recenter: 화면·카메라 제어.
- reset: 캐릭터를 초기 위치로 복귀.
- destroy: 게임·Canvas 정리.

## Engine → UI

- onReady: 첫 장면 업데이트 완료.
- onNear: 방문 가능한 장소 ID 또는 null.
- onPosition: 저장용 위치 스냅샷.
- onVisit: 상호작용 키로 상세 화면 요청.
- onNavigating: 자동 이동 상태.
- onBlocked: 클릭한 위치에 도달할 수 없음.
- onError: 장면 구성 실패를 재시도 가능한 UI로 전달.

## Failure states

앱 렌더 오류에는 다시 불러오기 화면을 제공한다. 엔진 모듈 로드 실패나 WebGL 컨텍스트 소실에는 맵의 재시도 화면을 제공한다. 로컬 저장 실패는 산책을 차단하지 않는다. 장소 그림은 원본 Canvas 묘화 결과이며 실사 사진으로 표시하지 않는다.
