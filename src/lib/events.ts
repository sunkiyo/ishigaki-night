export type Event = {
  id: string
  title: string
  date: string
  startTime: string
  venue: string
  spotId?: string
  category: 'live' | 'dj' | 'festival' | 'other'
  description: string
  thumb: string
  price?: string
  i18n?: {
    en?: { title: string; description: string }
    zh?: { title: string; description: string }
    ko?: { title: string; description: string }
  }
}

const eventsData: Event[] = [
  {
    id: 'ev-2026-04-04-groove',
    title: '島のDJナイト Vol.24',
    date: '2026-04-04',
    startTime: '21:00',
    venue: 'ISLAND GROOVE',
    spotId: 'live-island-groove',
    category: 'dj',
    thumb: '🎧',
    price: '¥1,500（1ドリンク付）',
    description: '地元DJが織りなす石垣の夜。沖縄・R&B・テクノが混ざり合う一夜。',
    i18n: {
      en: { title: 'Island DJ Night Vol.24', description: 'Local DJs blend Okinawan music, R&B, and techno for one unforgettable night.' },
      zh: { title: '岛屿DJ之夜 第24期', description: '当地DJ带来冲绳音乐、R&B和电子乐的融合之夜。' },
      ko: { title: '섬의 DJ 나이트 Vol.24', description: '현지 DJ가 펼치는 이시가키의 밤。오키나와·R&B·테크노가 어우러지는 하룻밤。' },
    },
  },
  {
    id: 'ev-2026-04-05-sango',
    title: '三線ライブ with 比嘉賢二',
    date: '2026-04-05',
    startTime: '20:00',
    venue: 'LIVE HOUSE サンゴ座',
    spotId: 'live-sango',
    category: 'live',
    thumb: '🎵',
    price: '¥2,000（1ドリンク付）',
    description: '石垣島出身の三線奏者・比嘉賢二による島唄ライブ。沖縄民謡の真髄を体感して。',
    i18n: {
      en: { title: 'Sanshin Live with Kenji Higa', description: 'Sanshin performer Kenji Higa born in Ishigaki plays authentic Okinawan folk songs.' },
      zh: { title: '三线琴现场演出 与比嘉贤二', description: '石垣岛出身的三线琴演奏者比嘉贤二带来的岛歌现场演出。' },
      ko: { title: '산신 라이브 with 히가 켄지', description: '이시가키 출신 산신 연주자 히가 켄지의 섬 음악 라이브。' },
    },
  },
  {
    id: 'ev-2026-04-11-jazz',
    title: 'JAZZ & Awamori Night',
    date: '2026-04-11',
    startTime: '20:30',
    venue: 'バー ゆうなんぎい',
    spotId: 'bar-yunangi',
    category: 'live',
    thumb: '🎷',
    price: '¥2,500（2ドリンク付）',
    description: '那覇から来島するジャズカルテットと石垣の泡盛が織りなす大人の夜。',
    i18n: {
      en: { title: 'JAZZ & Awamori Night', description: 'A jazz quartet from Naha pairs with Ishigaki Awamori for a sophisticated evening.' },
      zh: { title: 'JAZZ与泡盛之夜', description: '来自那霸的爵士四重奏与石垣泡盛共同演绎的成人之夜。' },
      ko: { title: 'JAZZ & 아와모리 나이트', description: '나하에서 온 재즈 콰르텟과 이시가키 아와모리가 어우러지는 어른의 밤。' },
    },
  },
  {
    id: 'ev-2026-04-12-dj',
    title: 'AQUA SPECIAL — Guest DJ YUKI',
    date: '2026-04-12',
    startTime: '22:00',
    venue: 'CLUB AQUA',
    spotId: 'club-aqua',
    category: 'dj',
    thumb: '🎧',
    price: '¥2,000（1ドリンク付）',
    description: '東京・大阪で活躍するゲストDJ YUKIが石垣に初上陸。House × Technoで夜明けまで。',
    i18n: {
      en: { title: 'AQUA SPECIAL — Guest DJ YUKI', description: 'Tokyo/Osaka-based guest DJ YUKI hits Ishigaki for the first time. House × Techno until dawn.' },
      zh: { title: 'AQUA特别场次 — 客座DJ YUKI', description: '活跃于东京、大阪的客座DJ YUKI首次登陆石垣岛。House × Techno玩到天亮。' },
      ko: { title: 'AQUA SPECIAL — 게스트 DJ YUKI', description: '도쿄·오사카에서 활약하는 게스트 DJ YUKI가 이시가키 첫 등장。House × Techno로 새벽까지。' },
    },
  },
  {
    id: 'ev-2026-04-18-festival',
    title: '石垣島ナイトライフフェスタ 2026',
    date: '2026-04-18',
    startTime: '18:00',
    venue: '石垣港離島ターミナル広場',
    category: 'festival',
    thumb: '🎪',
    price: '無料',
    description: '島内10店舗以上が参加する野外フードフェス＆音楽イベント。夕暮れから深夜まで楽しめる。',
    i18n: {
      en: { title: 'Ishigaki Nightlife Festa 2026', description: 'Outdoor food fest & music event with 10+ island venues. From sunset to midnight.' },
      zh: { title: '石垣岛夜生活节 2026', description: '岛内10家以上店铺参与的户外美食节和音乐活动。从傍晚到深夜尽情享受。' },
      ko: { title: '이시가키 나이트라이프 페스타 2026', description: '섬 내 10개 이상 매장이 참여하는 야외 푸드 페스티벌 & 음악 이벤트。해질 무렵부터 자정까지。' },
    },
  },
  {
    id: 'ev-2026-04-19-groove2',
    title: '島のDJナイト Vol.25',
    date: '2026-04-19',
    startTime: '21:00',
    venue: 'ISLAND GROOVE',
    spotId: 'live-island-groove',
    category: 'dj',
    thumb: '🎧',
    price: '¥1,500（1ドリンク付）',
    description: '毎週土曜恒例のDJナイト。今回は沖縄伝統音楽×エレクトロのスペシャルセット。',
    i18n: {
      en: { title: 'Island DJ Night Vol.25', description: 'Saturday night staple DJ event. Special set mixing Okinawan traditional music and electronica.' },
      zh: { title: '岛屿DJ之夜 第25期', description: '每周六例行DJ之夜。本次特别呈现冲绳传统音乐×电子乐的特别演出。' },
      ko: { title: '섬의 DJ 나이트 Vol.25', description: '매주 토요일 정기 DJ 나이트。이번엔 오키나와 전통 음악×일렉트로 스페셜 세트。' },
    },
  },
  {
    id: 'ev-2026-04-25-live',
    title: '与那国島から来島！民謡ライブ',
    date: '2026-04-25',
    startTime: '19:30',
    venue: 'LIVE HOUSE サンゴ座',
    spotId: 'live-sango',
    category: 'live',
    thumb: '🎶',
    price: '¥1,800（1ドリンク付）',
    description: '与那国島の民謡グループが石垣に初来演。八重山の島々の歌と踊りを一夜限りの特別公演で。',
    i18n: {
      en: { title: 'From Yonaguni Island! Folk Music Live', description: 'Yonaguni folk group makes their Ishigaki debut. Songs and dances from the Yaeyama islands.' },
      zh: { title: '与那国岛来访！民谣现场', description: '与那国岛民谣团体首次来石垣演出。八重山各岛屿的歌曲与舞蹈一夜限定特别公演。' },
      ko: { title: '요나구니 섬에서 왔어요！민요 라이브', description: '요나구니 섬 민요 그룹의 이시가키 첫 공연。야에야마 섬들의 노래와 춤을 하룻밤 한정 특별 공연으로。' },
    },
  },
]

export async function getEvents(): Promise<Event[]> {
  const today = new Date().toISOString().slice(0, 10)
  return eventsData.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
}
