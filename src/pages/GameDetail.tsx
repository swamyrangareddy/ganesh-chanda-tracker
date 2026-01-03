import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFestival } from '@/contexts/FestivalContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGame, getGameEntries, updateGame, getGameStatus, type Game, type GameEntry } from '@/lib/games';
import { Navigation } from '@/components/Navigation';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, EyeOff, Trophy, Settings, Vote, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddEntryDialog } from '@/components/games/AddEntryDialog';
import { VotingInterface } from '@/components/games/VotingInterface';
import { EntriesGrid } from '@/components/games/EntriesGrid';
import { GameSettings } from '@/components/games/GameSettings';
import { PasscodeDialog } from '@/components/PasscodeDialog';

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const { selectedFestival } = useFestival();
  const { currentOrganization, isAuthenticated, authenticate } = useOrganization();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('vote');
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);

  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => getGame(gameId!),
    enabled: !!gameId
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['game-entries', gameId],
    queryFn: () => getGameEntries(gameId!),
    enabled: !!gameId
  });

  const revealMutation = useMutation({
    mutationFn: (revealed: boolean) => updateGame(gameId!, { details_revealed: revealed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      toast({
        title: game?.details_revealed ? 'Details Hidden' : 'Details Revealed',
        description: game?.details_revealed 
          ? 'Participant details are now hidden'
          : 'Participant names and details are now visible'
      });
    }
  });

  const handleAdminAction = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setIsPasscodeOpen(true);
    }
  };

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('గేమ్ కనుగొనబడలేదు', 'Game not found')}</p>
      </div>
    );
  }

  const status = getGameStatus(game);
  const isVotingActive = status === 'voting';

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6">
        <BackButton />
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{game.name}</h1>
            <p className="text-muted-foreground">{game.category}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={isVotingActive ? 'default' : 'secondary'}>
                {status === 'voting' ? 'Voting Open' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              <Badge variant="outline">
                {entries.length} {t('ఎంట్రీలు', 'entries')}
              </Badge>
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => revealMutation.mutate(!game.details_revealed)}
                disabled={revealMutation.isPending}
              >
                {game.details_revealed ? (
                  <><EyeOff className="h-4 w-4 mr-1" /> Hide</>
                ) : (
                  <><Eye className="h-4 w-4 mr-1" /> Reveal</>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => handleAdminAction(() => setIsAddEntryOpen(true))}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Entry
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="vote">
              <Vote className="h-4 w-4 mr-1" />
              {t('వోట్ చేయండి', 'Vote')}
            </TabsTrigger>
            <TabsTrigger value="results">
              <Trophy className="h-4 w-4 mr-1" />
              {t('ఫలితాలు', 'Results')}
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-1" />
                {t('సెట్టింగ్స్', 'Settings')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="vote">
            <VotingInterface
              game={game}
              entries={entries}
              isVotingActive={isVotingActive}
            />
          </TabsContent>

          <TabsContent value="results">
            <EntriesGrid
              entries={entries}
              showDetails={game.details_revealed}
              showVotes={game.details_revealed || isAuthenticated}
            />
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="settings">
              <GameSettings game={game} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Navigation />

      <AddEntryDialog
        open={isAddEntryOpen}
        onOpenChange={setIsAddEntryOpen}
        gameId={game.id}
      />

      <PasscodeDialog
        open={isPasscodeOpen}
        onOpenChange={setIsPasscodeOpen}
        onAuthenticate={authenticate}
        organizationName={currentOrganization?.name || ''}
      />
    </div>
  );
}
