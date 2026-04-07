export type Guide = {
  id: string
  name: string
  area: string
  photo: string
  languages: string[]
  specialties: string[]
  rating: number
  reviews: number
  priceFrom: number
  bio: string
  i18n?: {
    en?: { name: string; bio: string }
    zh?: { name: string; bio: string }
    ko?: { name: string; bio: string }
  }
}

export const guides: Guide[] = [
  {
    id: 'guide-1',
    name: '宮城 沙織',
    area: '石垣市内',
    photo: '🌺',
    languages: ['日本語', 'English'],
    specialties: ['バー巡り', '泡盛文化', '地元グルメ'],
    rating: 4.9,
    reviews: 87,
    priceFrom: 4800,
    bio: '石垣島生まれ・育ち20年。観光客が知らないディープな夜の石垣を案内します。',
    i18n: {
      en: { name: 'Saori Miyagi', bio: 'Born and raised in Ishigaki for 20 years. Hidden izakayas and authentic awamori bars.' },
      zh: { name: '宫城 沙织', bio: '在石垣岛出生长大20年。带您探索游客不知道的深度夜生活。' },
      ko: { name: '미야기 사오리', bio: '이시가키에서 태어나고 자란 20년。현지 아와모리 바와 숨겨진 이자카야가 전문이에요。' },
    },
  },
  {
    id: 'guide-2',
    name: '大浜 健太',
    area: '石垣島全域',
    photo: '🎸',
    languages: ['日本語', 'English', '中文'],
    specialties: ['ライブハウス', '音楽シーン', 'クラフトビール'],
    rating: 4.8,
    reviews: 62,
    priceFrom: 5500,
    bio: '石垣のライブシーンを10年追い続けてきた音楽好き。',
    i18n: {
      en: { name: 'Kenta Ohama', bio: 'A music lover who has followed Ishigaki live scene for 10 years.' },
      zh: { name: '大浜 健太', bio: '追踪石垣岛现场音乐10年。' },
      ko: { name: '오하마 켄타', bio: '이시가키의 라이브 씬을 10년간 쫓아온 음악 팬。' },
    },
  },
  {
    id: 'guide-3',
    name: '石垣 美咲',
    area: '石垣市内・川平',
    photo: '🦋',
    languages: ['日本語', 'English'],
    specialties: ['女性向けナイトライフ', '工芸品', '島料理'],
    rating: 5.0,
    reviews: 41,
    priceFrom: 4200,
    bio: '旅行者・特に女性の方が安心して石垣の夜を楽しめるようサポートします。',
    i18n: {
      en: { name: 'Misaki Ishigaki', bio: 'I help travelers enjoy Ishigaki nights safely. Cozy restaurants and craft shops.' },
    },
  },
  {
    id: 'guide-4',
    name: '與那嶺 太一',
    area: '石垣島全域',
    photo: '🤿',
    languages: ['日本語', 'English', '한국어'],
    specialties: ['ナイトツアー', '星空観察', 'ナイトシュノーケル'],
    rating: 4.7,
    reviews: 55,
    priceFrom: 6800,
    bio: 'ダイビングインストラクター兼夜の島ガイド。星空とナイトシュノーケルが人気。',
    i18n: {
      en: { name: 'Taichi Yonamine', bio: 'Diving instructor and night guide. Stargazing and night beach courses are popular.' },
      zh: { name: '与那岭 太一', bio: '潜水教练兼夜间导游。星空与夜间浮潜组合课程深受欢迎。' },
      ko: { name: '요나미네 타이치', bio: '다이빙 강사 겸 밤의 섬 가이드。별하늘 관찰 코스가 인기예요。' },
    },
  },
]

export function getGuides(): Guide[] {
  return guides
}
