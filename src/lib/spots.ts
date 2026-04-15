export type Spot = {
  id: string
  name: string
  category: 'bar' | 'izakaya' | 'live' | 'club' | 'dining'
  area: string
  address: string
  openHour: number
  closeHour: number
  phone?: string
  instagram?: string
  thumb: string        // emoji or image path
  rating: number
  reviewCount: number
  priceRange: '¥' | '¥¥' | '¥¥¥'
  tags: string[]
  coupon?: {
    title: string
    description: string
    expiry: string
  }
  description: string
  i18n?: {
    en?: { name: string; description: string }
    zh?: { name: string; description: string }
    ko?: { name: string; description: string }
  }
  googleMapEmbed?: string
  featured?: boolean
}

export const spots: Spot[] = [
  // ── バー ──
  {
    id: 'bar-yunangi',
    name: 'バー ゆうなんぎい',
    category: 'bar',
    area: '石垣市街',
    address: '沖縄県石垣市大川238番地',
    openHour: 19,
    closeHour: 3,
    phone: '0980-83-0000',
    instagram: 'yunangi_ishigaki',
    thumb: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop&q=80',
    rating: 4.7,
    reviewCount: 214,
    priceRange: '¥¥',
    tags: ['泡盛', 'クラフトビール', 'カウンター席'],
    description: '泡盛と地元クラフトビールが揃う石垣島の老舗バー。カウンター越しに島人との会話が生まれる。',
    i18n: {
      en: { name: 'Bar Yunangi', description: 'A long-established bar with Awamori and local craft beer. Great conversations at the counter.' },
      zh: { name: '酒吧 Yunangi', description: '提供泡盛和当地精酿啤酒的老牌酒吧。可在吧台与当地人畅聊。' },
      ko: { name: '바 유난기', description: '아와모리와 현지 크래프트 맥주가 갖춰진 이시가키의 노포 바。' },
    },
    featured: true,
  },
  {
    id: 'bar-coral',
    name: 'BAR CORAL',
    category: 'bar',
    area: '美崎町',
    address: '沖縄県石垣市美崎町12番地',
    openHour: 20,
    closeHour: 4,
    instagram: 'bar_coral_ishigaki',
    thumb: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 138,
    priceRange: '¥¥',
    tags: ['カクテル', 'オーシャンビュー', 'デート向き'],
    description: '珊瑚をモチーフにしたインテリアが印象的。島素材を使ったオリジナルカクテルが人気。',
    i18n: {
      en: { name: 'BAR CORAL', description: 'Stunning coral-inspired interior. Known for original cocktails using local island ingredients.' },
      zh: { name: 'BAR CORAL', description: '以珊瑚为主题的室内装饰令人印象深刻。以使用岛屿食材的原创鸡尾酒闻名。' },
      ko: { name: 'BAR CORAL', description: '산호를 모티프로 한 인테리어가 인상적。섬의 식재료를 활용한 오리지널 칵테일이 인기。' },
    },
    featured: true,
  },
  {
    id: 'bar-minsa',
    name: 'みんさーBAR',
    category: 'bar',
    area: '新川',
    address: '沖縄県石垣市新川450番地',
    openHour: 18,
    closeHour: 2,
    thumb: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=400&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 89,
    priceRange: '¥',
    tags: ['泡盛', 'ローカル', 'リーズナブル'],
    description: '地元民に愛される気さくな小さなバー。泡盛の種類が50種以上。初心者向けのテイスティングセットも。',
    i18n: {
      en: { name: 'Minsa BAR', description: 'A cozy local bar loved by islanders. Over 50 types of Awamori with a beginner tasting set.' },
      zh: { name: 'Minsa BAR', description: '深受当地人喜爱的小酒吧。泡盛种类超过50种，还有初学者品酒套餐。' },
      ko: { name: '민사 BAR', description: '현지인들에게 사랑받는 아늑한 작은 바。아와모리 50종 이상, 초보자용 테이스팅 세트도 있어요。' },
    },
  },

  // ── ライブハウス ──
  {
    id: 'live-island-groove',
    name: 'ISLAND GROOVE',
    category: 'live',
    area: '石垣市街',
    address: '沖縄県石垣市美崎町8番地',
    openHour: 20,
    closeHour: 4,
    instagram: 'island_groove_ishigaki',
    thumb: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 312,
    priceRange: '¥¥',
    tags: ['ライブ', 'DJ', '島唄', 'ジャズ'],
    coupon: {
      title: '初来店ドリンク1杯無料',
      description: 'このクーポンを提示で、初来店の方にドリンク1杯をサービス。',
      expiry: '2026-12-31',
    },
    description: '島唄・ジャズ・DJが混在するライブハウス。毎週末はDJイベントを開催。石垣ナイトライフの中心地。',
    i18n: {
      en: { name: 'ISLAND GROOVE', description: 'A live house mixing island folk, jazz, and DJs. DJ events every weekend. The heart of Ishigaki nightlife.' },
      zh: { name: 'ISLAND GROOVE', description: '融合岛歌、爵士乐和DJ的现场酒吧。每周末举办DJ活动，是石垣岛夜生活的中心。' },
      ko: { name: 'ISLAND GROOVE', description: '섬 음악·재즈·DJ가 어우러진 라이브 하우스。매주 주말 DJ 이벤트 개최。이시가키 나이트라이프의 중심지。' },
    },
    featured: true,
  },
  {
    id: 'live-sango',
    name: 'LIVE HOUSE サンゴ座',
    category: 'live',
    area: '新栄町',
    address: '沖縄県石垣市新栄町23番地',
    openHour: 19,
    closeHour: 3,
    thumb: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 176,
    priceRange: '¥¥',
    tags: ['島唄', 'ライブ', '三線', '沖縄音楽'],
    description: '本格的な沖縄民謡と三線ライブが楽しめる老舗ライブハウス。島の音楽文化を肌で感じられる場所。',
    i18n: {
      en: { name: 'LIVE HOUSE Sango-za', description: 'Authentic Okinawan folk music and sanshin live shows. Feel the island music culture firsthand.' },
      zh: { name: 'LIVE HOUSE 珊瑚座', description: '可欣赏正宗冲绳民谣和三线琴现场演出的老牌演出场所。' },
      ko: { name: 'LIVE HOUSE 산고자', description: '정통 오키나와 민요와 산신 라이브를 즐길 수 있는 노포 라이브 하우스。' },
    },
    featured: true,
  },

  // ── 居酒屋 ──
  {
    id: 'izakaya-kaijin',
    name: '海人食堂',
    category: 'izakaya',
    area: '石垣港周辺',
    address: '沖縄県石垣市港町2番地',
    openHour: 17,
    closeHour: 24,
    phone: '0980-83-1111',
    thumb: 'https://images.unsplash.com/photo-1559339352-11d035aa65ce?w=600&h=400&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 287,
    priceRange: '¥¥',
    tags: ['海鮮', '刺身', '地魚', 'ファミリー可'],
    description: '漁師直送の新鮮な地魚を使った島料理が自慢。グルクンの唐揚げと島豆腐の揚げ出しが名物。',
    i18n: {
      en: { name: 'Kaijin Shokudo', description: 'Island cuisine with fresh local fish direct from fishermen. Known for fried gurukun and agedashi island tofu.' },
      zh: { name: '海人食堂', description: '使用渔民直送的新鲜地鱼制作岛屿料理。炸鱼和炸豆腐是招牌菜。' },
      ko: { name: '해인 식당', description: '어부 직송 신선한 지역 생선을 사용한 섬 요리가 자랑。구루쿤 튀김과 섬 두부 아게다시가 명물。' },
    },
    featured: true,
  },
  {
    id: 'izakaya-yanbaru',
    name: '山原（ヤンバル）',
    category: 'izakaya',
    area: '大浜',
    address: '沖縄県石垣市大浜331番地',
    openHour: 18,
    closeHour: 2,
    thumb: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 152,
    priceRange: '¥',
    tags: ['沖縄料理', 'リーズナブル', '地元民御用達'],
    description: '地元民が毎晩通う本物の沖縄居酒屋。チャンプルー各種と石垣牛のサガリが絶品。',
    i18n: {
      en: { name: 'Yanbaru', description: 'An authentic Okinawan izakaya where locals gather nightly. The champuru dishes and Ishigaki beef are outstanding.' },
      zh: { name: '山原', description: '当地人每晚光顾的正宗冲绳居酒屋。各种炒菜和石垣牛都是绝品。' },
      ko: { name: '얀바루', description: '현지인들이 매일 밤 찾는 정통 오키나와 이자카야。챰푸루와 이시가키 소고기가 절품。' },
    },
  },
  {
    id: 'izakaya-shima',
    name: '島ごはん なつ',
    category: 'izakaya',
    area: '真栄里',
    address: '沖縄県石垣市真栄里198番地',
    openHour: 18,
    closeHour: 1,
    thumb: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 201,
    priceRange: '¥¥',
    tags: ['島料理', '女性に人気', 'SNS映え'],
    coupon: {
      title: 'ドリンク1杯サービス',
      description: '2名以上のご来店でドリンク1杯（お一人様）をサービス。',
      expiry: '2026-09-30',
    },
    description: '石垣の食材にこだわった創作島料理。海ぶどうと島野菜の盛り合わせはインスタ映え抜群。',
    i18n: {
      en: { name: 'Shima Gohan Natsu', description: 'Creative island cuisine using Ishigaki ingredients. The sea grapes and island vegetable platter is perfect for photos.' },
      zh: { name: '岛餐 夏', description: '坚持使用石垣食材的创意岛屿料理。海葡萄和岛屿蔬菜拼盘非常适合拍照。' },
      ko: { name: '섬밥 나츠', description: '이시가키 식재료를 고집한 창작 섬 요리。바다 포도와 섬 채소 모둠은 SNS에 딱!。' },
    },
    featured: true,
  },

  // ── ダイニング ──
  {
    id: 'dining-sunset',
    name: 'SUNSET DINING',
    category: 'dining',
    area: '川平',
    address: '沖縄県石垣市川平927番地',
    openHour: 17,
    closeHour: 23,
    instagram: 'sunset_dining_ishigaki',
    thumb: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop&q=80',
    rating: 4.8,
    reviewCount: 423,
    priceRange: '¥¥¥',
    tags: ['サンセット', 'オーシャンビュー', '記念日', '石垣牛'],
    description: '川平湾を望む絶景テラス席。石垣牛ステーキと地元野菜を使ったコース料理が自慢。夕暮れ時の予約必至。',
    i18n: {
      en: { name: 'SUNSET DINING', description: 'Spectacular terrace overlooking Kabira Bay. Ishigaki beef steak and local vegetable courses. Reserve for sunset.' },
      zh: { name: 'SUNSET DINING', description: '可眺望川平湾的绝景露台。石垣牛排和使用当地蔬菜的套餐料理。日落时分一定要预约。' },
      ko: { name: 'SUNSET DINING', description: '카비라 만을 바라보는 절경 테라스 석。이시가키 소 스테이크와 현지 채소 코스 요리。석양 무렵 예약 필수。' },
    },
    featured: true,
  },
  {
    id: 'dining-ishigaki-beef',
    name: '石垣牛 もとぶ',
    category: 'dining',
    area: '石垣市街',
    address: '沖縄県石垣市大川88番地',
    openHour: 17,
    closeHour: 23,
    phone: '0980-83-2222',
    thumb: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&q=80',
    rating: 4.7,
    reviewCount: 356,
    priceRange: '¥¥¥',
    tags: ['石垣牛', 'ステーキ', '焼肉', '特別な日に'],
    description: 'A5ランクの石垣牛を使った焼肉・ステーキ専門店。島内牧場から直仕入れ、鮮度と質が違う。',
    i18n: {
      en: { name: 'Ishigaki Beef Motobu', description: 'Yakiniku and steak specialist using A5-rank Ishigaki beef sourced directly from local farms.' },
      zh: { name: '石垣牛 本部', description: '使用A5级石垣牛的烤肉・牛排专门店。直接从岛内牧场采购，新鲜度与品质卓越。' },
      ko: { name: '이시가키 소 모토부', description: 'A5 등급 이시가키 소를 사용한 야키니쿠·스테이크 전문점。섬 목장에서 직접 조달。' },
    },
  },

  // ── クラブ ──
  {
    id: 'club-aqua',
    name: 'CLUB AQUA',
    category: 'club',
    area: '美崎町',
    address: '沖縄県石垣市美崎町5番地 2F',
    openHour: 22,
    closeHour: 5,
    instagram: 'club_aqua_ishigaki',
    thumb: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 198,
    priceRange: '¥¥',
    tags: ['DJ', 'クラブ', 'ダンス', '深夜'],
    description: '石垣島最大級のクラブ。国内外からゲストDJが来島し、週末は深夜まで盛り上がる。',
    i18n: {
      en: { name: 'CLUB AQUA', description: "Ishigaki's largest club. Guest DJs from across Japan and abroad. Parties going until dawn every weekend." },
      zh: { name: 'CLUB AQUA', description: '石垣岛最大的俱乐部。每逢周末，国内外客座DJ纷纷前来，派对持续到深夜。' },
      ko: { name: 'CLUB AQUA', description: '이시가키 최대급 클럽。국내외 게스트 DJ가 방문하며 주말 새벽까지 열기가 넘쳐요。' },
    },
    featured: true,
  },

  // ── 追加スポット ──
  {
    id: 'bar-ryukyu-hoshizora',
    name: '琉球バー 星空',
    category: 'bar',
    area: '美崎町',
    address: '沖縄県石垣市美崎町21番地',
    openHour: 20,
    closeHour: 4,
    instagram: 'ryukyu_bar_hoshizora',
    thumb: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=400&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 167,
    priceRange: '¥¥',
    tags: ['泡盛', '星空', 'カクテル', 'ルーフトップ'],
    description: '屋上テラスから満天の星空を眺めながら楽しむ泡盛カクテルバー。石垣島の夜空は格別。',
    i18n: {
      en: { name: 'Ryukyu Bar Hoshizora', description: 'An Awamori cocktail bar with a rooftop terrace under the starry Ishigaki sky. A magical experience.' },
      zh: { name: '琉球酒吧 星空', description: '在屋顶露台仰望满天繁星，享用泡盛鸡尾酒的酒吧。石垣岛的夜空格外美丽。' },
      ko: { name: '류큐 바 호시조라', description: '옥상 테라스에서 별이 가득한 하늘을 바라보며 즐기는 아와모리 칵테일 바。' },
    },
    featured: true,
  },
  {
    id: 'izakaya-uminchu',
    name: '海んちゅ家',
    category: 'izakaya',
    area: '石垣港周辺',
    address: '沖縄県石垣市港町7番地',
    openHour: 17,
    closeHour: 24,
    phone: '0980-83-3456',
    thumb: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 224,
    priceRange: '¥¥',
    tags: ['海鮮', '島エビ', '石垣牛', 'ファミリー可'],
    coupon: {
      title: '石垣牛 小鉢サービス',
      description: 'テーブルご注文時に石垣牛の小鉢1品をサービス。',
      expiry: '2026-12-31',
    },
    description: '石垣港に近い漁師街の居酒屋。島エビの刺身と石垣牛のたたきは絶品の組み合わせ。',
    i18n: {
      en: { name: 'Uminchu-ya', description: 'A fishermen\'s izakaya near Ishigaki Port. The island shrimp sashimi and Ishigaki beef tataki are an outstanding pair.' },
      zh: { name: '海人之家', description: '位于石垣港附近渔人街的居酒屋。岛虾刺身和石垣牛肉片是绝佳搭配。' },
      ko: { name: '우민추야', description: '이시가키 항구 근처 어부 마을의 이자카야。섬 새우 회와 이시가키 소 타타키는 절품의 조합。' },
    },
  },
  {
    id: 'live-nuchigusui',
    name: 'ライブ & バー ぬちぐすい',
    category: 'live',
    area: '新栄町',
    address: '沖縄県石垣市新栄町11番地',
    openHour: 19,
    closeHour: 3,
    instagram: 'nuchigusui_live',
    thumb: 'https://images.unsplash.com/photo-1415201329753-cd5bc8d2d3f7?w=600&h=400&fit=crop&q=80',
    rating: 4.7,
    reviewCount: 143,
    priceRange: '¥¥',
    tags: ['ライブ', 'ジャズ', 'ブルース', 'カウンター席'],
    description: '「命の薬（ぬちぐすい）」を屋号に掲げる癒やしのライブバー。ジャズとブルースの生演奏が毎夜響く。',
    i18n: {
      en: { name: 'Live & Bar Nuchigusui', description: 'A healing live bar named after the Ryukyuan phrase for "medicine of life." Jazz and blues performed live every night.' },
      zh: { name: '现场演出酒吧 Nuchigusui', description: '以"生命之药"为名的治愈系现场酒吧。每晚都有爵士乐和蓝调现场演出。' },
      ko: { name: '라이브 & 바 누치구스이', description: '생명의 약이라는 류큐어를 상호로 내건 힐링 라이브 바。매일 밤 재즈와 블루스 라이브 연주。' },
    },
  },
  {
    id: 'club-neon-tropical',
    name: 'NEON TROPICAL',
    category: 'club',
    area: '美崎町',
    address: '沖縄県石垣市美崎町3番地 B1F',
    openHour: 23,
    closeHour: 6,
    instagram: 'neon_tropical_ishigaki',
    thumb: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 112,
    priceRange: '¥¥',
    tags: ['クラブ', 'DJ', 'トロピカル', 'レゲエ'],
    description: 'トロピカルネオンに彩られた地下クラブ。レゲエ・ダブステップ・テクノが交わる石垣の隠れ家的クラブシーン。',
    i18n: {
      en: { name: 'NEON TROPICAL', description: 'A basement club lit with tropical neon. Where reggae, dubstep, and techno collide in Ishigaki\'s hidden club scene.' },
      zh: { name: 'NEON TROPICAL', description: '霓虹灯装饰的地下俱乐部。雷鬼、电子舞步和铁克诺交织，是石垣岛隐秘的俱乐部圣地。' },
      ko: { name: 'NEON TROPICAL', description: '트로피칼 네온으로 꾸민 지하 클럽。레게·덥스텝·테크노가 교차하는 이시가키의 숨겨진 클럽 씬。' },
    },
  },
  {
    id: 'dining-mangrove-table',
    name: 'MANGROVE TABLE',
    category: 'dining',
    area: '吹通川周辺',
    address: '沖縄県石垣市桴海215番地',
    openHour: 17,
    closeHour: 23,
    instagram: 'mangrove_table_ishigaki',
    thumb: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 189,
    priceRange: '¥¥¥',
    tags: ['マングローブ', 'オープンエア', '石垣食材', 'ヴィーガン対応'],
    description: 'マングローブ林に隣接したオープンエアダイニング。石垣の山の幸と海の幸を使ったコース料理が楽しめる。',
    i18n: {
      en: { name: 'MANGROVE TABLE', description: 'Open-air dining adjacent to a mangrove forest. Course meals featuring the bounty of Ishigaki\'s mountains and sea.' },
      zh: { name: 'MANGROVE TABLE', description: '毗邻红树林的露天餐厅。可享用以石垣山珍海味为食材的套餐料理。' },
      ko: { name: 'MANGROVE TABLE', description: '맹그로브 숲에 인접한 오픈에어 다이닝。이시가키의 산해진미를 사용한 코스 요리를 즐길 수 있어요。' },
    },
    featured: true,
  },
  {
    id: 'izakaya-shima-kuwa',
    name: '島桑（しまくわ）',
    category: 'izakaya',
    area: '大川',
    address: '沖縄県石垣市大川145番地',
    openHour: 18,
    closeHour: 1,
    phone: '0980-83-7890',
    thumb: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 134,
    priceRange: '¥',
    tags: ['島野菜', '地産地消', 'ヘルシー', '一人飲み歓迎'],
    description: '石垣島産の島野菜と地魚にこだわった小料理屋。旬の食材を使った一品料理とひとり飲みにも最適なカウンター席。',
    i18n: {
      en: { name: 'Shima Kuwa', description: 'A small bistro committed to local island vegetables and fish. Seasonal small plates, perfect for solo dining at the counter.' },
      zh: { name: '岛桑', description: '坚持使用石垣岛产岛屿蔬菜和地鱼的小餐馆。使用当季食材的单品料理，吧台位置非常适合独饮。' },
      ko: { name: '시마쿠와', description: '이시가키산 섬 채소와 지역 생선을 고집한 소요리 가게。제철 식재료를 사용한 단품 요리와 혼자 마시기 딱 좋은 카운터 석。' },
    },
  },
  {
    id: 'bar-otoridori',
    name: 'BAR 鳳凰木（おおとりどり）',
    category: 'bar',
    area: '石垣市街',
    address: '沖縄県石垣市大川302番地 2F',
    openHour: 21,
    closeHour: 5,
    instagram: 'bar_otoridori_ishigaki',
    thumb: 'https://images.unsplash.com/photo-1527621515182-ea3f89e72e3f?w=600&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 98,
    priceRange: '¥¥',
    tags: ['カクテル', 'バーテンダー', 'こだわり', '大人の夜'],
    description: '石垣の街路樹・鳳凰木をモチーフにした2Fバー。バーテンダーが丁寧に作るオリジナルカクテルは島の香りを纏う。',
    i18n: {
      en: { name: 'BAR Otoridori', description: 'A 2nd-floor bar inspired by the flamboyant tree that lines Ishigaki\'s streets. Original cocktails crafted with island aromas.' },
      zh: { name: 'BAR 凤凰木', description: '以石垣街头凤凰木为主题的2楼酒吧。调酒师精心调制的原创鸡尾酒带有岛屿芬芳。' },
      ko: { name: 'BAR 오오토리도리', description: '이시가키 가로수 봉황목을 모티프로 한 2층 바。바텐더가 정성껏 만드는 오리지널 칵테일은 섬의 향기가 감돌아요。' },
    },
  },
]

// カテゴリ別ダミー写真プール（Unsplash）
const CATEGORY_THUMBS: Record<string, string[]> = {
  bar: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1527621515182-ea3f89e72e3f?w=600&h=400&fit=crop&q=80',
  ],
  izakaya: [
    'https://images.unsplash.com/photo-1559339352-11d035aa65ce?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&q=80',
  ],
  live: [
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1415201329753-cd5bc8d2d3f7?w=600&h=400&fit=crop&q=80',
  ],
  club: [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop&q=80',
  ],
  dining: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop&q=80',
  ],
}

/** カテゴリとslugからダミー写真を一貫して決める */
function pickThumb(category: string, slug: string): string {
  const pool = CATEGORY_THUMBS[category] ?? CATEGORY_THUMBS.other
  // slugの文字コード合計でプールからインデックスを決定（常に同じ写真）
  const hash = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return pool[hash % pool.length]
}

export async function getSpots(): Promise<Spot[]> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('is_published', true)
      .order('name')

    if (error || !data || data.length === 0) {
      return spots
    }

    return data.map((row): Spot => ({
      id: row.slug,
      name: row.name,
      category: row.category,
      area: row.address?.split('県')?.[1]?.split('市')?.[0] ?? '石垣島',
      address: row.address ?? '',
      openHour: parseInt(row.open_hours?.split(':')[0] ?? '19'),
      closeHour: parseInt(row.open_hours?.split('-')[1]?.split(':')[0] ?? '2'),
      thumb: row.image_urls?.[0] ?? pickThumb(row.category, row.slug),
      rating: 4.5,
      reviewCount: 0,
      priceRange: (row.price_range as Spot['priceRange']) ?? '¥¥',
      tags: row.tags ?? [],
      description: row.description ?? '',
      phone: row.phone ?? undefined,
      i18n: {
        en: row.name_en ? { name: row.name_en, description: row.description_en ?? '' } : undefined,
      },
    }))
  } catch {
    return spots
  }
}

export async function getSpotById(id: string): Promise<Spot | undefined> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('slug', id)
      .eq('is_published', true)
      .single()

    if (error || !data) {
      return spots.find((s) => s.id === id)
    }

    return {
      id: data.slug,
      name: data.name,
      category: data.category,
      area: data.address?.split('県')?.[1]?.split('市')?.[0] ?? '石垣島',
      address: data.address ?? '',
      openHour: parseInt(data.open_hours?.split(':')[0] ?? '19'),
      closeHour: parseInt(data.open_hours?.split('-')[1]?.split(':')[0] ?? '2'),
      thumb: data.image_urls?.[0] ?? pickThumb(data.category, data.slug),
      rating: 4.5,
      reviewCount: 0,
      priceRange: (data.price_range as Spot['priceRange']) ?? '¥¥',
      tags: data.tags ?? [],
      description: data.description ?? '',
      phone: data.phone ?? undefined,
      i18n: {
        en: data.name_en ? { name: data.name_en, description: data.description_en ?? '' } : undefined,
      },
    }
  } catch {
    return spots.find((s) => s.id === id)
  }
}
