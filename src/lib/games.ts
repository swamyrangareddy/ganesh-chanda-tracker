import { supabase } from '@/integrations/supabase/client';

export interface Game {
  id: string;
  festival_id: string | null;
  organization_id: string | null;
  name: string;
  category: string;
  description: string | null;
  photo_instructions: string | null;
  voting_start: string | null;
  voting_end: string | null;
  details_revealed: boolean;
  status: string;
  max_votes_per_mobile: number;
  created_at: string;
  updated_at: string;
}

export interface GameEntry {
  id: string;
  game_id: string;
  photo_url: string;
  photo_path: string;
  participant_name: string;
  participant_details: string | null;
  participant_mobile: string | null;
  vote_count: number;
  created_at: string;
  updated_at: string;
}

export interface GameVote {
  id: string;
  game_id: string;
  entry_id: string;
  mobile_number: string;
  created_at: string;
}

export const getGames = async (festivalId: string) => {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('festival_id', festivalId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Game[];
};

export const getGame = async (gameId: string) => {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Game | null;
};

export const createGame = async (game: Omit<Game, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('games')
    .insert(game)
    .select()
    .single();
  
  if (error) throw error;
  return data as Game;
};

export const updateGame = async (id: string, updates: Partial<Game>) => {
  const { data, error } = await supabase
    .from('games')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Game;
};

export const deleteGame = async (id: string) => {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getGameEntries = async (gameId: string) => {
  const { data, error } = await supabase
    .from('game_entries')
    .select('*')
    .eq('game_id', gameId)
    .order('vote_count', { ascending: false });
  
  if (error) throw error;
  return data as GameEntry[];
};

export const createGameEntry = async (entry: Omit<GameEntry, 'id' | 'vote_count' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('game_entries')
    .insert(entry)
    .select()
    .single();
  
  if (error) throw error;
  return data as GameEntry;
};

export const deleteGameEntry = async (id: string) => {
  const { error } = await supabase
    .from('game_entries')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const castVote = async (gameId: string, entryId: string, mobileNumber: string) => {
  const { data, error } = await supabase
    .from('game_votes')
    .insert({
      game_id: gameId,
      entry_id: entryId,
      mobile_number: mobileNumber
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as GameVote;
};

export const getRemainingVotes = async (gameId: string, mobileNumber: string): Promise<number> => {
  const { data, error } = await supabase
    .rpc('get_remaining_votes', { p_game_id: gameId, p_mobile: mobileNumber });
  
  if (error) throw error;
  return data as number;
};

export const getVotedEntries = async (gameId: string, mobileNumber: string) => {
  const { data, error } = await supabase
    .from('game_votes')
    .select('entry_id')
    .eq('game_id', gameId)
    .eq('mobile_number', mobileNumber);
  
  if (error) throw error;
  return data.map(v => v.entry_id);
};

export const getGameStatus = (game: Game): 'draft' | 'upcoming' | 'voting' | 'ended' => {
  if (game.status === 'draft') return 'draft';
  
  const now = new Date();
  const votingStart = game.voting_start ? new Date(game.voting_start) : null;
  const votingEnd = game.voting_end ? new Date(game.voting_end) : null;
  
  if (votingStart && now < votingStart) return 'upcoming';
  if (votingEnd && now > votingEnd) return 'ended';
  if (votingStart && now >= votingStart) return 'voting';
  
  return 'draft';
};
