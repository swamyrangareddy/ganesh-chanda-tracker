import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useFestival } from '@/contexts/FestivalContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGames, getGameStatus, type Game } from '@/lib/games';
import { Navigation } from '@/components/Navigation';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trophy, Clock, Vote, Lock, Eye, EyeOff } from 'lucide-react';
import { CreateGameDialog } from '@/components/games/CreateGameDialog';
import { PasscodeDialog } from '@/components/PasscodeDialog';
import { format } from 'date-fns';

export default function Games() {
  const { selectedFestival } = useFestival();
  const { currentOrganization, isAuthenticated, authenticate } = useOrganization();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);

  const { data: games = [] } = useQuery({
    queryKey: ['games', selectedFestival?.id],
    queryFn: () => getGames(selectedFestival!.id),
    enabled: !!selectedFestival?.id
  });

  const handleCreateClick = () => {
    if (isAuthenticated) {
      setIsCreateOpen(true);
    } else {
      setIsPasscodeOpen(true);
    }
  };

  const getStatusBadge = (game: Game) => {
    const status = getGameStatus(game);
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'upcoming':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Upcoming</Badge>;
      case 'voting':
        return <Badge className="bg-green-500"><Vote className="h-3 w-3 mr-1" />Voting Open</Badge>;
      case 'ended':
        return <Badge variant="destructive"><Trophy className="h-3 w-3 mr-1" />Ended</Badge>;
    }
  };

  if (!selectedFestival) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('ఉత్సవాన్ని ఎంచుకోండి', 'Please select a festival')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6">
        <BackButton />
        
        <div className="flex justify-between items-start mb-6">
          <PageHeader
            pageName="Games & Voting"
            pageNameTelugu="గేమ్స్ & వోటింగ్"
            description="Photo competitions"
            descriptionTelugu="ఫోటో పోటీలు"
          />
          
          <Button onClick={handleCreateClick} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            {t('గేమ్ జోడించు', 'Add Game')}
          </Button>
        </div>

        {games.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Card 
                key={game.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/org/${currentOrganization?.slug}/games/${game.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{game.name}</CardTitle>
                      <CardDescription>{game.category}</CardDescription>
                    </div>
                    {getStatusBadge(game)}
                  </div>
                </CardHeader>
                <CardContent>
                  {game.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {game.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {game.voting_start && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(game.voting_start), 'MMM d')}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {game.details_revealed ? (
                        <><Eye className="h-3 w-3" /> Revealed</>
                      ) : (
                        <><EyeOff className="h-3 w-3" /> Hidden</>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground">
              {t('గేమ్స్ లేవు', 'No games yet')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('ఫోటో పోటీలు జోడించండి', 'Add photo competitions for your festival')}
            </p>
          </div>
        )}
      </div>

      <Navigation />

      <CreateGameDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        festivalId={selectedFestival.id}
        organizationId={currentOrganization?.id || ''}
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
