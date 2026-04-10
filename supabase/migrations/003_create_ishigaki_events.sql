CREATE TABLE ishigaki_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  event_end_date DATE,                          -- 複数日イベント用（省略可）
  event_name TEXT NOT NULL,
  event_name_en TEXT,
  category TEXT NOT NULL DEFAULT 'other',       -- festival/sports/music/marine/food/other
  demand_boost FLOAT DEFAULT 0.10,              -- 需要への影響度 0.0〜0.5
  venue TEXT,
  source_url TEXT,
  is_confirmed BOOLEAN DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ishigaki_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are viewable by everyone"
  ON ishigaki_events FOR SELECT USING (true);

CREATE INDEX idx_events_date ON ishigaki_events(event_date);
