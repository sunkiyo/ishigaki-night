CREATE TABLE demand_weekly (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE UNIQUE NOT NULL,
  trends INTEGER,
  flight INTEGER,
  hotel INTEGER,
  index INTEGER,
  is_forecast BOOLEAN DEFAULT false,
  confidence FLOAT DEFAULT 1.0,
  note TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE demand_weekly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public demand data is viewable by everyone"
  ON demand_weekly FOR SELECT
  USING (true);
CREATE INDEX idx_demand_weekly_week_start ON demand_weekly(week_start);
