# ISHIGAKI NIGHT（石垣島ナイト）

## プロジェクト概要
石垣島のナイトライフ情報メディアサイト。国内観光客が石垣島のナイトスポットを探して、行きたい店を見つけられるWebサービス。

## ゴール（v1.0）
- 国内観光客がナイトスポットを探せる
- 営業時にクライアントへデモとして見せられる
- **完了条件**: Vercelデプロイ済み、20店舗以上掲載、日英2言語、README完成

## 期限
2026年4月中

## 技術スタック
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイル**: Tailwind CSS
- **DB**: Supabase (PostgreSQL) — 新規プロジェクト
- **多言語**: next-intl (ja, en)
- **デプロイ**: Vercel
- **リポジトリ**: github.com/sunkiyo/ishigaki-night

## ディレクトリ構成
```
ishigaki-night/
├── CLAUDE.md
├── README.md
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # トップページ
│   │   │   ├── spots/
│   │   │   │   ├── page.tsx       # スポット一覧
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx   # スポット詳細
│   │   │   ├── demo/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx   # クライアント向けデモ
│   │   │   └── about/
│   │   │       └── page.tsx       # 石垣ナイト紹介
│   │   └── layout.tsx             # Root layout
│   ├── components/
│   │   ├── layout/                # Header, Footer, Navigation
│   │   ├── spots/                 # SpotCard, SpotList, SpotFilter, SpotDetail
│   │   ├── demo/                  # DemoSpotView
│   │   └── ui/                    # 共通UIコンポーネント
│   ├── lib/
│   │   ├── supabase.ts            # Supabaseクライアント
│   │   └── utils.ts
│   ├── messages/
│   │   ├── ja.json
│   │   └── en.json
│   └── types/
│       └── spot.ts                # Spot型定義
├── supabase/
│   └── migrations/
│       └── 001_create_spots.sql
├── public/
│   └── images/
├── next.config.ts
├── tailwind.config.ts
└── .env.local
```

## Supabase テーブル設計

### spots テーブル
```sql
CREATE TABLE spots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,  -- 'bar', 'izakaya', 'snack', 'club', 'other'
  description TEXT,
  description_en TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  open_hours TEXT,         -- 例: "19:00-02:00"
  closed_days TEXT,        -- 例: "月曜定休"
  phone TEXT,
  image_urls TEXT[],       -- Supabase Storageの画像URLの配列
  affiliate_url TEXT,      -- じゃらん等のアフィリエイトリンク
  tags TEXT[],             -- 例: ['カクテル', 'DJ', 'ライブ']
  price_range TEXT,        -- 例: '¥2,000〜¥4,000'
  atmosphere TEXT,         -- 例: 'カジュアル', 'おしゃれ', 'ディープ'
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS有効化
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;

-- 公開スポットは誰でも読める
CREATE POLICY "Public spots are viewable by everyone"
  ON spots FOR SELECT
  USING (is_published = true);

-- slugでの検索用インデックス
CREATE INDEX idx_spots_slug ON spots(slug);
CREATE INDEX idx_spots_category ON spots(category);
```

## ページ仕様

### トップページ (/)
- ヒーローセクション（石垣島の夜景 + キャッチコピー）
- カテゴリ別のスポット導線
- 注目スポット3〜5件のピックアップ

### スポット一覧 (/spots)
- カテゴリフィルター（バー、居酒屋、スナック、クラブ/ライブ、その他）
- カード型レイアウト
- 写真、店名、カテゴリ、雰囲気タグ表示

### スポット詳細 (/spots/[slug])
- メイン写真 + ギャラリー
- 店舗情報（営業時間、住所、電話、価格帯）
- 雰囲気・タグ
- Google Maps埋め込み（lat/lng使用）
- アフィリエイトリンクボタン（あれば）

### デモページ (/demo/[slug])
- スポット詳細と同じレイアウトだが、ヘッダーに「掲載イメージ」バナー
- クライアント営業時にURLを送って「こう載ります」と見せる用

### About (/about)
- ISHIGAKI NIGHTの紹介
- フリーペーパーとの連携説明
- 広告掲載の問い合わせ導線

## デザイン方針
- **トーン**: 石垣島の夜 × トロピカル × 大人の遊び場
- **配色**: ダークベース（夜のイメージ）+ ネオンカラーのアクセント
- **フォント**: 日本語はNoto Sans JP、英語はディスプレイフォントで個性を出す
- **レスポンシブ**: モバイルファースト（観光客はスマホで見る）

## 開発ルール
- コミットメッセージは日本語OK
- 環境変数は `.env.local` に置く（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）
- データ投入はSQL経由（Claude Codeで実行）
- 画像はv1.0ではplaceholder画像でOK、後から差し替え

## v2.0 以降のロードマップ
- 需要予測ダッシュボード（旧プロジェクトから移植）
- 繁体字中国語対応
- 管理画面UI（店舗CRUD）
- ユーザー口コミ / 評価機能
- SNS連携（Instagram埋め込み）
- PWA対応
