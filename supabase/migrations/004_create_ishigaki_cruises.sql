CREATE TABLE ishigaki_cruises (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  arrival_date  DATE NOT NULL,
  arrival_time  TEXT,
  departure_time TEXT,
  ship_name     TEXT NOT NULL,
  passengers    INTEGER,
  berth         TEXT,
  route         TEXT,
  source_url    TEXT DEFAULT 'nacru.my.site.com',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ishigaki_cruises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public cruises are viewable by everyone"
  ON ishigaki_cruises FOR SELECT USING (true);

CREATE INDEX idx_cruises_arrival_date ON ishigaki_cruises(arrival_date);
