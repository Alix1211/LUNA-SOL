"use strict";

// Dialogue copied from EP002_SCRIPT_R01, split at its existing work scenes.
const northTowerScenes = [
  {
    "title": "낯선 방의 아침",
    "sceneId": "EP002_SC01",
    "place": "room",
    "lines": [
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "……잠은 잤네."
      },
      {
        "speaker": "아일라",
        "mood": "작은 웃음",
        "text": "무너지지 않은 것만 해도 다행이지."
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "밖은 어제랑 별다를 게 없고."
      },
      {
        "speaker": "아일라",
        "mood": "찡그림",
        "text": "남은 물도 이만큼이네. 샘을 제대로 고치려면……"
      },
      {
        "speaker": "아일라",
        "mood": "멈칫",
        "text": "뭐지?"
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "바람에 뭐가 흔들리나?"
      },
      {
        "speaker": "아일라",
        "mood": "의아",
        "text": "지붕에서 나는 소리는 아닌 것 같은데."
      }
    ]
  },
  {
    "title": "북쪽으로 이어지는 계단",
    "sceneId": "EP002_SC02",
    "place": "stairs",
    "lines": [
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "여긴 조용하고……"
      },
      {
        "speaker": "아일라",
        "mood": "의아",
        "text": "저 위에서 나는 소리였어."
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "계단은 있는데 발을 디딜 곳이 없네."
      },
      {
        "speaker": "아일라",
        "mood": "단호",
        "text": "이대로 올라가는 건 안 되겠다."
      },
      {
        "speaker": "아일라",
        "mood": "생각",
        "text": "어제 남겨 둔 재료로 디딤판 정도는 손볼 수 있겠어."
      }
    ],
    "mission": "M004"
  },
  {
    "title": "북쪽으로 이어지는 계단",
    "sceneId": "EP002_SC02",
    "place": "stairs",
    "lines": [
      {
        "speaker": "아일라",
        "mood": "안도",
        "text": "이 정도면 괜찮겠지."
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "하나씩 손보면 이 성도 사람 사는 곳이 되겠어."
      }
    ]
  },
  {
    "title": "먼지 쌓인 탑의 방",
    "sceneId": "EP002_SC03",
    "place": "tower",
    "lines": [
      {
        "speaker": "아일라",
        "mood": "찡그림",
        "text": "여기는 몇 년째 안 열었나 봐."
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "처음 들은 소리는 저거였나?"
      },
      {
        "speaker": "아일라",
        "mood": "생각",
        "text": "그런데 아까는 조금 달랐는데."
      },
      {
        "speaker": "아일라",
        "mood": "놀람",
        "text": "……여기에도 뭐가 있나?"
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "우선 이것부터 치우자."
      }
    ],
    "mission": "M005"
  },
  {
    "title": "은빛 알",
    "sceneId": "EP002_SC04",
    "place": "tower",
    "lines": [
      {
        "speaker": "아일라",
        "mood": "의아",
        "text": "돌인가?"
      },
      {
        "speaker": "아일라",
        "mood": "놀람",
        "text": "움직였어?"
      },
      {
        "speaker": "아일라",
        "mood": "생각",
        "text": "돌이 움직일 리는 없잖아."
      },
      {
        "speaker": "아일라",
        "mood": "당황",
        "text": "앗, 조심!"
      },
      {
        "speaker": "아일라",
        "mood": "작은 목소리",
        "text": "……알?"
      },
      {
        "speaker": "아일라",
        "mood": "놀람",
        "text": "정말 알이구나."
      },
      {
        "speaker": "아일라",
        "mood": "조용히",
        "text": "이런 데서 혼자 있었어?"
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "가만있어 봐. 적어도 바람은 안 맞게 해 줄게."
      }
    ]
  },
  {
    "title": "처음 만드는 둥지",
    "sceneId": "EP002_SC05",
    "place": "tower",
    "lines": [
      {
        "speaker": "아일라",
        "mood": "찡그림",
        "text": "이 위에 계속 놔두면 떨어지겠네."
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "이건 원래 내 옷 싸 두려고 가져온 건데……"
      },
      {
        "speaker": "아일라",
        "mood": "미소",
        "text": "너한테 더 필요하겠다."
      },
      {
        "speaker": "아일라",
        "mood": "놀람",
        "text": "지금 대답한 거야?"
      },
      {
        "speaker": "아일라",
        "mood": "쓴웃음",
        "text": "내가 벌써 혼잣말이 늘었네."
      }
    ],
    "mission": "M006"
  },
  {
    "title": "처음 만드는 둥지",
    "sceneId": "EP002_SC05",
    "place": "tower",
    "lines": [
      {
        "speaker": "아일라",
        "mood": "만족",
        "text": "이제 덜 흔들리겠다."
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "창문도 막아 줘야겠어. 이 정도 바람이면 춥지 않을까?"
      }
    ]
  },
  {
    "title": "물방울 하나",
    "sceneId": "EP002_SC06",
    "place": "tower",
    "lines": [
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "뭘 먹는지는 모르겠지만…… 물은 필요하지 않을까."
      },
      {
        "speaker": "아일라",
        "mood": "놀람",
        "text": "어?"
      },
      {
        "speaker": "아일라",
        "mood": "조용히",
        "text": "지금 빛난 거 맞지?"
      },
      {
        "speaker": "아일라",
        "mood": "생각",
        "text": "손으로 만졌을 땐 안 그랬는데."
      },
      {
        "speaker": "아일라",
        "mood": "기본",
        "text": "물을 더 구해야겠네."
      },
      {
        "speaker": "아일라",
        "mood": "미소",
        "text": "오늘은 네 자리를 만들었으니까, 그걸로 됐어."
      },
      {
        "speaker": "아일라",
        "mood": "작은 목소리",
        "text": "내일도 와 볼게."
      },
      {
        "speaker": "내레이션",
        "mood": "최소",
        "text": "성의 북쪽 탑에는 이제 작은 온기가 남아 있었다."
      }
    ]
  }
];

const northTowerWorks = {
  M004: {id:"M004",name:"탑 계단 복원",place:"stairs",size:8,inputs:["wood"],goals:["plank","plank"]},
  M005: {id:"M005",name:"탑 내부 정리",place:"tower",size:8,inputs:["twigs","wood"],goals:["broom","plank"]},
  M006: {id:"M006",name:"첫 보호 둥지",place:"tower",size:8,inputs:["rag","wood"],goals:["bedroll","plank"]}
};
