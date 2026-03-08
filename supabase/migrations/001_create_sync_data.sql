-- マイグレーション 001: sync_data テーブル作成
-- Focuso クラウド同期用ストレージ

CREATE TABLE IF NOT EXISTS sync_data (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_key  TEXT NOT NULL,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, store_key)
);

ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ読み書き可能
CREATE POLICY "own_data" ON sync_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_sync_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_data_updated_at
  BEFORE UPDATE ON sync_data
  FOR EACH ROW EXECUTE FUNCTION update_sync_data_updated_at();
