-- Shared cache of generated ElevenLabs audio, so each (voice, text) pair is only
-- paid for once across all users. Written and read exclusively by the
-- generate-tts edge function with the service role; private with no policies,
-- so clients cannot list or read it directly.
INSERT INTO storage.buckets (id, name, public) VALUES
  ('tts-cache', 'tts-cache', false)
ON CONFLICT (id) DO NOTHING;
