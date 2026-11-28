# 루나솔 작업 인수인계

이 문서는 다른 대화에서 게임 작업을 시작할 때 먼저 읽는 기준입니다. 실제 최신 커밋과 Actions 결과를 링크에서 확인하세요.

## 작업 기준

| 항목 | 위치 |
| --- | --- |
| 배포 브랜치 | [codex/luna-sol-android](https://github.com/Alix1211/LUNA-SOL/tree/codex/luna-sol-android) |
| 분리 게임 소스 | `complete-build/index.html`, `style.css`, `js/`, `assets/` |
| Android 앱 | `android/` |
| 배포 설정 | `.github/workflows/luna-sol-android.yml` |
| APK 빌드 기록 | [Luna Sol Android and game publishing](https://github.com/Alix1211/LUNA-SOL/actions/workflows/luna-sol-android.yml) |
| 오프라인 V6 HTML | [luna-sol-v6](https://github.com/Alix1211/LUNA-SOL/releases/tag/luna-sol-v6) |
| 앱 업데이트 파일 | [luna-sol-live](https://github.com/Alix1211/LUNA-SOL/releases/tag/luna-sol-live) |
| Android 설치 테스트 | [luna-sol-app-preview](https://github.com/Alix1211/LUNA-SOL/releases/tag/luna-sol-app-preview) |
| 정식 APK | [luna-sol-app](https://github.com/Alix1211/LUNA-SOL/releases/tag/luna-sol-app), 정식 서명 설정 후 생성 |

## 적용 이력

- V3에서는 여섯 드래곤의 개별 돌봄, 마나, 진행 구간별 주문을 연결했습니다.
- V4에서는 배경음·효과음·별빛을 추가했습니다.
- V5에서는 양피지 의뢰서, 성 활동 화면, 아이콘과 중세풍 메뉴를 적용했습니다.
- V6에서는 목재 머지 작업대, 등대 의뢰 배경, 녹스 투명 반응 스프라이트를 적용했습니다. V6는 개발용 분리 소스와 오프라인 HTML로 배포했습니다.
- Android 브랜치는 V6에서 분기했습니다. 초승달, 은빛 드래곤, 별을 주제로 그린 시작 아이콘을 `android/art/luna-app.png`에 넣고, 가로 고정 앱에서 실행하도록 했습니다. 머지 규칙 및 90화 이야기 데이터는 V6 기준입니다.

## 앱 시작과 업데이트

문플로의 방식에서 배운 핵심은 Android 설치 파일과 게임 데이터 배포를 분리하는 것입니다. 루나솔은 GitHub Releases의 `latest.json`과 버전별 게임 ZIP을 사용합니다. 앱은 현재 가지고 있는 게임을 먼저 실행하고 백그라운드에서 새 버전을 확인합니다. 다운로드한 ZIP은 SHA-256과 압축 경로를 검사한 뒤 보관합니다. 다음 앱 시작 때 적용되며, 다운로드가 끝난 뒤 게임 메뉴의 **최신 버전 적용**을 눌러도 됩니다. 네트워크 오류가 나면 현재 설치된 게임으로 계속 플레이합니다.

웹 파일 수정은 배포 브랜치의 `complete-build/`에서 합니다. 게임 데이터만 바뀌면 새 ZIP만 배포합니다. Android 코드 또는 배포 설정이 바뀌면 APK 빌드도 실행합니다. 릴리스의 `latest.json`은 새 ZIP 업로드 뒤에 갱신합니다. 배포 시 GitHub Actions 결과와 릴리스의 파일 목록을 모두 확인해야 합니다.

## 저장과 기기 변경

- 플레이 데이터는 앱 내부 `lunasol-save.json`에 원자적으로 저장합니다. WebView의 브라우저 저장은 보조 경로입니다.
- 진행 중 저장과 앱을 벗어날 때 저장을 모두 실행합니다. 회차 체험은 본편 저장을 건드리지 않습니다.
- 앱 메뉴에서 **저장 내보내기 / 저장 불러오기**를 지원합니다. 앱을 교체할 때 이전 앱에서 JSON을 내보내고 새 앱에서 가져올 수 있습니다.
- 예전 V6 단일 HTML은 주소와 저장 공간이 달라 앱에 진행이 바로 나타나지 않습니다. 원래 열었던 브라우저의 `localStorage`에 있는 `lunasol.guide.v1` JSON을 꺼낸 뒤 가져와야 합니다.

## 서명과 확인 남은 항목

정식 앱 ID는 `com.lunasol.game`입니다. 동일 APK를 갱신 설치하려면 서명 키를 유지해야 합니다. 공개 저장소에는 개인 서명 키나 비밀번호를 올리지 않습니다. GitHub Actions Secrets에 `LUNA_KEYSTORE_B64`, `LUNA_KEYSTORE_PASSWORD`, `LUNA_KEY_ALIAS`, `LUNA_KEY_PASSWORD`를 등록하면 정식 APK가 빌드됩니다. APK 빌드 조건을 만족하도록 Android 쪽 변경을 배포 브랜치에 올리거나, 워크플로를 기본 브랜치에도 등록한 뒤 수동 실행을 사용합니다.

서명 설정 전 빌드는 `com.lunasol.game.preview`로 분리됩니다. 이 APK에서도 게임 업데이트를 확인할 수 있습니다. Actions의 임시 키로 만든 APK는 서로 다른 빌드 사이의 덮어쓰기를 보장할 수 없으므로, 장기 설치 기준은 같은 개인 키로 서명한 정식 APK입니다.

실기기 확인 항목은 설치 후 첫 실행, 비행기 모드 재실행, 가로 전체 화면, 실제 저장 복원, Wi-Fi에서 버전 전환 뒤 같은 진행 이어하기입니다. 개발자가 확인한 빌드 결과와 실기기 결과를 다음 로그에 추가하세요.

## 2026-11-28 빌드 기록

- [첫 빌드](https://github.com/Alix1211/LUNA-SOL/actions/runs/46140043197)에서 게임 ZIP 배포는 성공했습니다. APK는 AndroidX 빌드 설정 누락으로 중단했습니다. `android/gradle.properties`에 `android.useAndroidX=true`를 추가했습니다.

- [AndroidX 수정 후 빌드](https://github.com/Alix1211/LUNA-SOL/actions/runs/46142583222)는 APK 컴파일, 서명 검증, 배포 및 게임 ZIP 공개까지 성공했습니다. [설치 검증용 APK](https://github.com/Alix1211/LUNA-SOL/releases/download/luna-sol-app-preview/luna-sol-preview.apk)는 `com.lunasol.game.preview`입니다.
- 공개된 빌드 `3ee4d44311139bb299188dbd50fca975d4a59ae9`의 업데이트 ZIP을 다시 내려받아 SHA-256과 압축 무결성, 필수 게임 파일을 확인했습니다.
- 정식 서명 키를 별도 생성했습니다. GitHub 계정 로그인 후 Actions Secrets에 등록하고 정식 APK를 다시 빌드해야 합니다. 개인 키나 암호를 저장소 문서·코드에 기록하지 않습니다.
- 태블릿 실기기의 설치, 저장 복원, 업데이트 후 이어하기는 검증 전입니다.

## 정식판 타이틀과 주요 장면 일러스트

- 타이틀의 회차 체험은 기본 화면에서 숨겼습니다. 개발용 브라우저에서만 주소 끝에 `?dev-preview=1`을 붙여 열 수 있습니다. 기존 체험 저장 보호는 유지합니다.
- 기존 삽화 연출은 카엘 첫 등장(3화), 정원 장면, 니베 알의 움직임(6화)에 있습니다. 새 삽화는 같은 화면에 중복 삽입하지 않도록 확인합니다.
- 전체화면 삽화 12개 후보를 먼저 검토합니다. 6화 니베 부화(기존 알 연출과 통합), 20화 브리아 부화, 32화 이그니스의 첫 불, 41화 네리아 부화, 42화 등대의 저녁, 48화 카엘의 고백, 51화 베일의 첫 날갯짓, 66화 녹스와 기록, 76화 니베 구출, 77화 세레나의 각성, 89화 첫 일출, 90화 성 정원 엔딩입니다.
- 원본 대본의 사건과 인물 관계를 유지합니다. 핵심 대사나 행동 직후에 그림이 자연스럽게 드러나고, 플레이어가 탭할 때 다음 장면으로 넘어갑니다. 첫 일출과 정원 엔딩은 별도 장면입니다.
- 이 목록은 제작 후보입니다. 신규 CG 생성과 삽입은 미실시입니다.
