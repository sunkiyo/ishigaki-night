import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { getSpots } from '@/lib/spots'
import { getLatestDemand } from '@/lib/demand'
import { getEvents } from '@/lib/events'
import { getGuides } from '@/lib/guides'
import DemandBadge from '@/components/dashboard/DemandBadge'
import SpotCard from '@/components/spots/SpotCard'
import EventCard from '@/components/events/EventCard'
import GuideCard from '@/components/guides/GuideCard'

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }, { locale: 'zh' }, { locale: 'ko' }]
}

const ARTICLES = [
  { id: 'art-1', tag: 'インタビュー', tagEn: 'Interview', tagZh: '访谈', tagKo: '인터뷰', title: '「石垣の夜は、生き物だ」——ISLAND GROOVEオーナーが語る10年', titleEn: '"Ishigaki nights are alive" — 10 years with ISLAND GROOVE', titleZh: '「石垣的夜晚是活的」——ISLAND GROOVE老板讲述10年', titleKo: '「이시가키의 밤은 살아있다」——ISLAND GROOVE 오너가 말하는 10년', date: '2026-03-20', img: '🎤' },
  { id: 'art-2', tag: '特集', tagEn: 'Feature', tagZh: '特辑', tagKo: '특집', title: 'クルーズ客が増えた今、石垣のバーはどう変わっているか', titleEn: "How Ishigaki's bars are changing as cruise tourism grows", titleZh: '邮轮游客增多，石垣岛的酒吧正在如何变化', titleKo: '크루즈 관광객이 늘어난 지금, 이시가키의 바는 어떻게 변하고 있나', date: '2026-03-15', img: '🚢' },
  { id: 'art-3', tag: 'ニュース', tagEn: 'News', tagZh: '新闻', tagKo: '뉴스', title: '2026年春、石垣島に新しいクラフトビールバーがオープン予定', titleEn: 'New craft beer bar set to open in Ishigaki spring 2026', titleZh: '2026年春，石垣岛将新开一家精酿啤酒吧', titleKo: '2026년 봄, 이시가키에 새 크래프트 맥주 바 오픈 예정', date: '2026-03-10', img: '🍺' },
]

const SOCIAL_POSTS = [
  { id: 's1', platform: 'instagram', handle: 'island_groove_ishigaki', thumb: '🎵', caption: '今夜はJAZZナイト！21時スタート', likes: 142 },
  { id: 's2', platform: 'tiktok', handle: 'yunangi_ishigaki', thumb: '🍶', caption: '新入荷の泡盛、飲んでみて', likes: 387 },
  { id: 's3', platform: 'instagram', handle: 'bar_coral_ishigaki', thumb: '🪸', caption: '夕暮れのカウンターから', likes: 98 },
  { id: 's4', platform: 'tiktok', handle: 'ishigaki_night_official', thumb: '🌺', caption: '今週末のイベントまとめ', likes: 512 },
]

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params
  setRequestLocale(locale)
  const spots   = (await getSpots()).slice(0, 3)
  const demand  = await getLatestDemand()
  const events  = (await getEvents()).slice(0, 2)
  const guides  = getGuides()

  const p = (ja: string, en: string, zh: string, ko: string) =>
    locale === 'en' ? en : locale === 'zh' ? zh : locale === 'ko' ? ko : ja

  const demandMsg =
    demand.index >= 75
      ? p('今夜は超満員の予感——早めに席を確保して',
          'Peak season — every bar is rocking tonight',
          '今晚预计爆满——请尽早预约座位',
          '오늘 밤 만석 예상——서둘러 자리를 확보하세요')
      : demand.index >= 55
      ? p('にぎやかな夜になりそう——週末を楽しもう',
          'Busy weekend ahead — grab a spot early',
          '今晚会很热闹——享受周末吧',
          '활기찬 밤이 될 것 같아요——주말을 즐겨요')
      : p('のんびりムードの夜——ゆっくり飲むなら今日がいい',
          'Relaxed vibe tonight — perfect for a quiet drink',
          '今晚氛围悠闲——适合慢慢品酒',
          '여유로운 분위기의 밤——천천히 마시기 딱 좋아요')

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle,rgb(var(--gold)/.18) 0%,transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '40%', right: '5%', width: 300, height: 300, background: 'radial-gradient(circle,rgb(var(--gold2)/.14) 0%,transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '20%', left: '40%', width: 350, height: 350, background: 'radial-gradient(circle,rgb(var(--gold)/.10) 0%,transparent 70%)', filter: 'blur(50px)' }} />
        </div>
        <div className="relative mb-6 flex items-center gap-3">
          <div style={{ width: 32, height: 1, background: 'linear-gradient(90deg,transparent,rgb(var(--gold)))' }} />
          <span className="text-xs tracking-[0.4em] uppercase text-gold">
            {p('石垣島ナイトライフガイド', 'Ishigaki Nightlife Guide', '石垣岛夜生活指南', '이시가키 나이트라이프 가이드')}
          </span>
          <div style={{ width: 32, height: 1, background: 'linear-gradient(90deg,rgb(var(--gold)),transparent)' }} />
        </div>
        <h1 className="relative font-mincho leading-tight mb-6" style={{ fontSize: 'clamp(2.2rem,6vw,4.5rem)' }}>
          <span style={{ background: 'linear-gradient(90deg,rgb(var(--gold)),rgb(var(--gold2)),rgb(var(--gold)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {p('あの夜の石垣島、', 'That night in Ishigaki,', '那个夜晚的石垣岛，', '그날 밤 이시가키，')}
          </span>
          <br />
          <span style={{ color: 'rgb(var(--ink))' }}>
            {p('きっとずっと忘れない。', "you'll remember forever.", '永远难以忘怀。', '분명히 평생 잊지 못할 거예요。')}
          </span>
        </h1>
        <p className="relative text-sm leading-loose max-w-lg mb-10 opacity-60" style={{ color: 'rgb(var(--ink))' }}>
          {p(
            '旅の記憶に残るのは、昼間の海よりも夜の路地だったりする。石垣島のリアルな夜を、あなたへ。',
            'The best bars, live houses, and izakayas — curated for travelers who want the real island night.',
            '最好的酒吧、现场演出和居酒屋——为想体验真实岛屿夜晚的旅行者精心挑选。',
            '최고의 바, 라이브 하우스, 이자카야——진짜 섬의 밤을 원하는 여행자를 위해 엄선했습니다。'
          )}
        </p>
        <div className="relative flex flex-wrap gap-3 justify-center">
          <Link href={`/${locale}/spots`} className="px-8 py-3 text-sm font-medium tracking-wide text-white transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg,rgb(var(--gold)),rgb(var(--gold2)))', borderRadius: 2 }}>
            {p('スポットを探す', 'Find Spots', '寻找场所', '스팟 찾기')}
          </Link>
          <Link href={`/${locale}/dashboard`} className="px-8 py-3 text-sm tracking-wide transition-opacity hover:opacity-70 text-gold" style={{ border: '1px solid rgb(var(--gold)/.5)', borderRadius: 2 }}>
            {p('今夜の混み具合', "Tonight's Forecast", '今晚拥挤程度', '오늘 밤 혼잡도')}
          </Link>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30">
          <div className="w-px h-12 mx-auto" style={{ background: 'linear-gradient(to bottom,rgb(var(--gold)),transparent)' }} />
        </div>
      </section>

      {/* ── SOCIAL ── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-1 text-gold">SOCIAL</p>
            <h2 className="font-mincho text-xl font-semibold" style={{ color: 'rgb(var(--ink))' }}>
              {p('インスタ・TikTok 最新投稿', 'Latest from Instagram & TikTok', 'Instagram & TikTok 最新动态', '인스타·TikTok 최신 게시물')}
            </h2>
          </div>
          <span className="text-xs opacity-40" style={{ color: 'rgb(var(--ink))' }}>
            {p('毎時更新', 'Updated hourly', '每小时更新', '매시간 업데이트')}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SOCIAL_POSTS.map(post => (
            <div key={post.id} className="rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform bg-surface" style={{ border: '1px solid rgb(var(--gold)/.2)' }}>
              <div className="h-32 flex items-center justify-center text-4xl relative" style={{ background: 'rgb(var(--gold)/.12)' }}>
                {post.thumb}
                <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded font-medium text-gold" style={{ background: 'rgb(var(--gold)/.2)' }}>
                  {post.platform === 'tiktok' ? 'TT' : 'IG'}
                </span>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium mb-1 text-gold">@{post.handle}</p>
                <p className="text-xs opacity-60 line-clamp-2 leading-relaxed" style={{ color: 'rgb(var(--ink))' }}>
                  {post.caption}
                </p>
                <p className="text-xs mt-2 text-gold opacity-70">♥ {post.likes}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs opacity-40 mt-3 text-center" style={{ color: 'rgb(var(--ink))' }}>
          {p('※ サンプル表示。API連携で実際の投稿を表示できます', '* Sample posts — connect Instagram/TikTok API for real posts', '※ 示例展示。API连接后可显示真实帖子', '※ 샘플 표시. API 연동으로 실제 게시물을 표시할 수 있습니다')}
        </p>
      </section>

      {/* ── SPOTS ── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-1 text-gold">SPOTS</p>
            <h2 className="font-mincho text-xl font-semibold" style={{ color: 'rgb(var(--ink))' }}>
              {p('おすすめスポット', 'Featured Spots', '推荐场所', '추천 스팟')}
            </h2>
          </div>
          <Link href={`/${locale}/spots`} className="text-xs opacity-50 hover:opacity-100 transition-opacity text-gold">
            {p('すべて見る →', 'View All →', '查看全部 →', '전체 보기 →')}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {spots.map(s => <SpotCard key={s.id} spot={s} locale={locale} />)}
        </div>
      </section>

      {/* ── EVENTS ── */}
      {events.length > 0 && (
        <section className="px-6 pb-16 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-1 text-gold">EVENTS</p>
              <h2 className="font-mincho text-xl font-semibold" style={{ color: 'rgb(var(--ink))' }}>
                {p('今週末のイベント', 'This Weekend', '本周末活动', '이번 주말 이벤트')}
              </h2>
            </div>
            <Link href={`/${locale}/events`} className="text-xs opacity-50 hover:opacity-100 transition-opacity text-gold">
              {p('イベント一覧 →', 'All Events →', '全部活动 →', '이벤트 전체 →')}
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {events.map(e => <EventCard key={e.id} event={e} locale={locale} />)}
          </div>
        </section>
      )}

      {/* ── LOCAL GUIDES ── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-1 text-gold">LOCAL GUIDES</p>
            <h2 className="font-mincho text-xl font-semibold" style={{ color: 'rgb(var(--ink))' }}>
              {p('石垣を知り尽くしたガイドと夜へ', 'Meet Your Local Guide', '与了解石垣的导游探索夜晚', '이시가키를 잘 아는 가이드와 밤으로')}
            </h2>
            <p className="text-xs mt-1 opacity-50" style={{ color: 'rgb(var(--ink))' }}>
              {p('地元ガイドによる少人数ナイトツアー', 'Private tours with island insiders', '当地导游带领的小团夜间游览', '현지 가이드의 소규모 나이트 투어')}
            </p>
          </div>
          <Link href={`/${locale}/guides`} className="text-xs opacity-50 hover:opacity-100 transition-opacity text-gold whitespace-nowrap">
            {p('ガイド一覧 →', 'All Guides →', '全部导游 →', '가이드 전체 →')}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {guides.map(g => <GuideCard key={g.id} guide={g} locale={locale} />)}
        </div>
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          {[
            { icon: '✓', text: p('認定ローカルガイド', 'Verified local guides', '认证本地导游', '인증 현지 가이드') },
            { icon: '🔒', text: p('安心・安全な予約', 'Secure booking', '安全预订', '안전한 예약') },
            { icon: '⭐', text: p('平均評価 4.9', '4.9 avg rating', '平均评分 4.9', '평균 평점 4.9') },
            { icon: '💬', text: p('多言語対応', 'Multilingual support', '多语言支持', '다국어 지원') },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-1.5 text-xs opacity-60" style={{ color: 'rgb(var(--ink))' }}>
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── STORIES ── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-1 text-gold">STORIES</p>
            <h2 className="font-mincho text-xl font-semibold" style={{ color: 'rgb(var(--ink))' }}>
              {p('記事・インタビュー', 'Stories & News', '文章・访谈', '기사·인터뷰')}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ARTICLES.map(a => (
            <div key={a.id} className="rounded-xl overflow-hidden cursor-pointer transition-opacity hover:opacity-90 bg-surface" style={{ border: '1px solid rgb(var(--gold)/.2)' }}>
              <div className="h-36 flex items-center justify-center text-5xl" style={{ background: 'rgb(var(--gold)/.1)' }}>
                {a.img}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded text-gold font-medium" style={{ background: 'rgb(var(--gold)/.15)' }}>
                    {p(a.tag, a.tagEn, a.tagZh, a.tagKo)}
                  </span>
                  <span className="text-xs opacity-40" style={{ color: 'rgb(var(--ink))' }}>{a.date}</span>
                </div>
                <p className="text-sm font-medium leading-relaxed line-clamp-3" style={{ color: 'rgb(var(--ink))' }}>
                  {p(a.title, a.titleEn, a.titleZh, a.titleKo)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 今夜の石垣島（最下部） ── */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="rounded-2xl p-6 md:p-10" style={{ background: 'rgb(var(--gold)/.08)', border: '1px solid rgb(var(--gold)/.25)' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-2 text-gold">TONIGHT</p>
              <h2 className="font-mincho text-2xl font-semibold mb-1" style={{ color: 'rgb(var(--ink))' }}>
                {p('今夜の石垣島', "Tonight's Ishigaki", '今晚的石垣岛', '오늘 밤의 이시가키')}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded text-gold" style={{ background: 'rgb(var(--gold)/.15)' }}>
                  {p('需要指数', 'Demand index', '需求指数', '수요 지수')} <strong>{demand.index}</strong>/100
                </span>
              </div>
              <p className="text-sm mt-2 opacity-60" style={{ color: 'rgb(var(--ink))' }}>
                {demandMsg}
              </p>
            </div>
            <Link href={`/${locale}/dashboard`} className="text-xs whitespace-nowrap text-gold opacity-70 hover:opacity-100 transition-opacity">
              {p('詳しく見る →', 'Full forecast →', '查看详情 →', '자세히 보기 →')}
            </Link>
          </div>
          <DemandBadge demand={demand} locale={locale} />
        </div>
      </section>
    </>
  )
}
