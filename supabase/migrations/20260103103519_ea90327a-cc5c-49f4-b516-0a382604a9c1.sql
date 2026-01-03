-- Create games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id UUID REFERENCES public.festivals(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  photo_instructions TEXT,
  voting_start TIMESTAMP WITH TIME ZONE,
  voting_end TIMESTAMP WITH TIME ZONE,
  details_revealed BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  max_votes_per_mobile INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_entries table
CREATE TABLE public.game_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  participant_details TEXT,
  participant_mobile TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_votes table
CREATE TABLE public.game_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.game_entries(id) ON DELETE CASCADE,
  mobile_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, entry_id, mobile_number)
);

-- Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_votes ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Anyone can view games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Anyone can insert games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update games" ON public.games FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete games" ON public.games FOR DELETE USING (true);

-- Game entries policies
CREATE POLICY "Anyone can view entries" ON public.game_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert entries" ON public.game_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update entries" ON public.game_entries FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete entries" ON public.game_entries FOR DELETE USING (true);

-- Game votes policies
CREATE POLICY "Anyone can view votes" ON public.game_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.game_votes FOR INSERT WITH CHECK (true);

-- Create function to increment vote count
CREATE OR REPLACE FUNCTION public.increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.game_entries 
  SET vote_count = vote_count + 1, updated_at = now()
  WHERE id = NEW.entry_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-increment vote count
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON public.game_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_vote_count();

-- Create function to get remaining votes for a mobile number
CREATE OR REPLACE FUNCTION public.get_remaining_votes(p_game_id UUID, p_mobile TEXT)
RETURNS INTEGER AS $$
DECLARE
  max_votes INTEGER;
  used_votes INTEGER;
BEGIN
  SELECT g.max_votes_per_mobile INTO max_votes
  FROM public.games g WHERE g.id = p_game_id;
  
  SELECT COUNT(*) INTO used_votes
  FROM public.game_votes v WHERE v.game_id = p_game_id AND v.mobile_number = p_mobile;
  
  RETURN COALESCE(max_votes, 5) - COALESCE(used_votes, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add index for faster vote counting
CREATE INDEX idx_game_votes_mobile ON public.game_votes(game_id, mobile_number);
CREATE INDEX idx_game_entries_game ON public.game_entries(game_id);
CREATE INDEX idx_games_festival ON public.games(festival_id);