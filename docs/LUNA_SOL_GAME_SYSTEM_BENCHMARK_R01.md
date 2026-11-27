# LUNA SOL · 게임 시스템 조사 및 비교 R01

2026-11-27 · 공개 자료와 프로젝트 자료를 비교한 설계 조사

## 결론

루나솔은 **플레이어가 골라 만든 물건이 공간과 생활을 바꾸고, 그 변화가 다음 제작을 가치 있게 만드는 게임**을 목표로 한다. 상용 사례의 성과는 비교 대상을 고르는 근거다. 특정 기능이 매출이나 잔존율의 원인이었다고 확인할 수 있는 데이터는 공개 자료에서 확보하지 못했다. 아래의 반복 동기는 기능을 연결한 설계 해석이다.

| 사례 | 확인한 루프 | 다음 플레이를 부르는 이유 | 루나솔 적용 판단 |
|---|---|---|---|
| **Merge Mansion** | 작업 목록 → 보드에서 물품 제작 → 정원과 저택의 구역 복원 → 새 공간과 이야기. 공식 안내와 Great Hall 공개 영상의 설명이 이 순서를 뒷받침한다. Old Well은 반복 작업으로 생산기를 다시 확보할 수 있고 필요 없을 때 판매해 보드 자리를 확보한다. | 제작한 물건이 익숙한 장소를 바꾸고, 다음에 실제로 들어갈 곳과 알아볼 일이 생긴다. 생산기를 비우고 다시 얻을 수 있어 보드 구성이 가변적이다. | 장소별 전후·동선·방문 행동, 생산기 정리·회수. 간단한 덩어리의 복원을 매 회차에 연속 강제하거나 생활품까지 단일 목록이 배정하는 방식은 피한다. |
| **Travel Town** | 보드의 생산기에서 탭으로 재료 생산 → 동일품을 합쳐 주문 납품 → 코인·물품 → 건설·업그레이드 → 생산기·새 계열. 동일 시스템에서 남은 재고와 여러 주문을 비교한다. | 주문에 바로 쓰기, 다음 제작을 위해 남기기, 시설에 투자하기 사이에서 동일 재료와 보드 칸이 경쟁한다. 생산기 편성도 선택이다. 공식 업데이트는 일부 보조 계열을 단순화하고 에너지 소모가 큰 희귀품을 제거했다. | 주문을 서사에서 독립시키고, 생산기·주문·기존 재고를 연결한다. 재료를 뽑기 위한 강제 에너지 대기, 희귀 필수품, 의미 없이 쌓인 보조 계열은 제외한다. |
| **Merge Dragons!** | 반복 가능한 퍼즐에서 보상을 캠프로 가져오고 캠프를 성장시킨다. 드래곤을 성장시키면 캠프에서의 활동과 공간 개방에 연결된다. 공식 도움말은 드래곤이 활동 후 집에서 쉰다고 설명한다. | 임시 활동의 결과가 지속 공간과 수집·성장에 남는다. 캠프가 커지며 새 경관과 다음 장기 목표가 보인다. | 둥지와 환경에 행동을 연결하고 탐험 결과가 집에 남게 한다. 드래곤·알 합성, 드래곤 파워 총합으로 지역을 여는 방식, 휴식 완료까지 현실 시간을 기다려야 하는 구조는 루나솔의 동의·돌봄과 맞지 않는다. |
| **Merge County** | 제작 재료를 합쳐 마을을 복원하고 주민의 일을 해결한다. 발전하며 구역·인물·새 머지 기회가 열린다. | 건축으로 생활권이 넓어지고 같은 재료의 쓰임새가 달라진다. 마을 사람의 존재가 시설이 필요한 이유를 제공한다. | 완공에 주민의 새 행동, 공급처, 주문 유형 등 최소 한 가지 기능 변화를 붙인다. 계정 레벨 숫자만 채우는 지역 잠금은 구체적인 통행·시설 조건으로 대체한다. |
| **Merge Mayor** | 작업대에서 도구·농장·건물 관련 물품을 만들고 마을 프로젝트와 지역 발전에 쓴다. 공개 스토어 페이지에서 꾸준한 기능 업데이트와 오프라인 플레이 안내도 확인된다. | 한 번 완성된 마을이 플레이 기록으로 남고, 다른 시설로 관심이 옮겨 간다. 장기 프로젝트를 나눠 갖는 동기가 있다. | 지역 시설 하나를 복구→이용→특화로 쪼갠다. 기간 한정 보상, 광고, 상자 충전 대기는 제외한다. 한 스토어 리뷰의 대기 불만은 위험 사례로만 읽는다. |

## 근거와 자료의 한계

- **Merge Mansion** · Metacore는 2023년 누적 5천만 다운로드 도달을 발표했다. 작업 목록과 반복 우물의 동작은 공식 지원에서 확인했다. Great Hall 영상의 설명은 복원 후 공간을 여는 사례다. 내부 제작 요구량 분포나 평균 완공 시간은 확보하지 못했다. 조작 비용은 제작 계보가 깊어질 때 급증한다는 구조로만 비교한다. [Metacore 발표](https://metacoregames.com/press-release/merge-mansion-developer-metacore-expands-to-berlin-as-merge-mansion-hits-50m-downloads) · [작업 목록](https://support.metacoregames.com/hc/en/merge-mansion/articles/how-do-i-know-what-i-should-do-next-80) · [우물 생산기](https://support.metacoregames.com/hc/en/merge-mansion/articles/how-can-i-get-the-water-bucket-producer-275) · [공식 영상과 설명](https://www.youtube.com/watch?v=mPH11O0_7J4)
- **Travel Town** · 공식 도움말에 생산 비용, 주문과 건물의 관계, 드래그가 명시돼 있다. 계열 간소화 공지는 당시 변경 사항이며 전 버전·전 이용자에게 같은 구성이 적용된다는 근거로 쓰지 않았다. AppMagic은 2024년 대부분 기간의 장르 선도 사례로 분류했다. [보드](https://support.traveltowngame.com/hc/en-us/articles/4833664499090-The-Merge-Board) · [보드 아이템](https://support.traveltowngame.com/hc/ko/articles/4833684165522) · [계열 업데이트](https://support.traveltowngame.com/hc/en-us/articles/18254985564434-What-Changes-have-been-made-to-my-Producers-and-Board) · [AppMagic H1 2025](https://appmagic.rocks/research/casual-report-h1-2025)
- **Merge Dragons!** · 공식 퍼블리셔·스토어의 반복 레벨과 캠프 설명을 공식 숙소·드래곤 파워 도움말과 대조했다. 서식 공간과 성장의 결합은 확인했으며, 개체 선호나 돌봄의 깊이를 입증하는 출처는 아니다. [Zynga 제품 페이지](https://www.zynga.com/games/merge-dragons/) · [Google Play](https://play.google.com/store/apps/details?id=com.gramgames.mergedragons) · [Dragon Home](https://gramgames.helpshift.com/hc/en/9-merge-dragons-1497457953/faq/58-how-can-i-make-my-dragons-sleep-faster/) · [Dragon Power](https://zyngasupport.helpshift.com/hc/en/82-merge-dragons/faq/13759-why-did-my-dragon-power-go-down/)
- **Merge County / Merge Mayor** · 열람한 Google Play 표시 구간은 각각 500만+와 100만+ 다운로드다. Merge Mayor는 영상 설명과 스토어 자료를 보조 대조했고, 스토어의 2026년 8월 리뷰 한 건에서 생산 대기가 길다는 불만을 확인했다. 해당 리뷰는 이용자 전체의 평가나 정확한 대기 수치를 증명하지 않는다. [Merge County](https://play.google.com/store/apps/details?id=com.mf.town) · [Merge Mayor 스토어·업데이트·리뷰](https://play.google.com/store/apps/details?hl=ko&id=games.starberry.idlevillage) · [Merge Mayor 플레이 영상 자료](https://www.youtube.com/watch?v=dKzMRhCOO7U)

자료 범위는 공개 설명·영상 설명·공개 리뷰다. 상용 앱을 직접 설치해 조작하거나 프레임 단위로 계측하지 않았다. 프로젝트 참고작은 제공된 HTML의 보드·생산·주문·재고 동작만 검토했다. 참고작에서는 6×6 판 옆에 주문과 재고가 동시에 보이고, 생산→이동→합성 결과가 연속적으로 표현된다. 구체적 자산·화면·대사 대신 탭 반응성과 원인·결과가 눈에 보이는 구성을 참고한다.

## 루나솔 검증 항목

1. 퀘스트 제공자를 끈 30분 동안 공간 배치, 거래, 돌봄 가운데 적어도 두 가지가 서로 다음 목표를 만든다.
2. 동일한 초기 재고에서 가구 우선과 생산 시설 우선이 다음 행동·보상·작업량을 달리한다.
3. 안 쓰는 생산기를 빼면 작업할 칸이 생기고, 수납 후에도 필수 생산기를 다시 호출할 수 있다.
4. 희귀품 요구, 판매·재구매 차익, 목적 없는 1단계 재료 탭 또는 제출만으로 게임 시간을 채우는 구간을 따로 센다.
5. 세션을 멈추고 돌아왔을 때 제작 중인 물건, 가구 위치, 드래곤 행동 기록, 장기 준비의 완료 부품이 남아 있다.
