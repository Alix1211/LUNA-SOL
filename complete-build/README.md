# LUNA SOL V6

브라우저에서 실행되는 루나솔 V6 소스입니다.

```sh
python3 -m http.server 8000
```

저장소 루트에서 실행하고 `http://localhost:8000/complete-build/`을 엽니다. HTTP로 열어야 분리된 사운드를 불러올 수 있습니다. 단일 HTML 배포본은 별도 다운로드로 제공됩니다.

- `index.html`, `style.css`는 화면 구조와 스타일입니다.
- `js/`에는 스토리, 저장, 머지, 생활 및 돌봄 기능을 포함합니다.
- `assets/`에는 실행에 필요한 이미지와 사운드가 있습니다.

## 단일 HTML로 묶기

```sh
python3 complete-build/bundle.py LUNA_SOL_COMPLETE_V6.html
```

이미지와 음원을 HTML 안에 포함하는 오프라인 빌드를 생성합니다.
