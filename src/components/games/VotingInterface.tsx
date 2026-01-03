import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { castVote, getRemainingVotes, getVotedEntries, type Game, type GameEntry } from '@/lib/games';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, Vote, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface VotingInterfaceProps {
  game: Game;
  entries: GameEntry[];
  isVotingActive: boolean;
}

export function VotingInterface({ game, entries, isVotingActive }: VotingInterfaceProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [mobileNumber, setMobileNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const { data: remainingVotes = 0, refetch: refetchVotes } = useQuery({
    queryKey: ['remaining-votes', game.id, mobileNumber],
    queryFn: () => getRemainingVotes(game.id, mobileNumber),
    enabled: isVerified && !!mobileNumber
  });

  const { data: votedEntries = [], refetch: refetchVoted } = useQuery({
    queryKey: ['voted-entries', game.id, mobileNumber],
    queryFn: () => getVotedEntries(game.id, mobileNumber),
    enabled: isVerified && !!mobileNumber
  });

  const voteMutation = useMutation({
    mutationFn: (entryId: string) => castVote(game.id, entryId, mobileNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-entries', game.id] });
      refetchVotes();
      refetchVoted();
      toast({ title: 'Vote Cast!', description: 'Your vote has been recorded' });
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast({ title: 'Already Voted', description: 'You already voted for this entry', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to cast vote', variant: 'destructive' });
      }
    }
  });

  const handleVerify = () => {
    const cleaned = mobileNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      toast({ title: 'Invalid Number', description: 'Please enter a valid mobile number', variant: 'destructive' });
      return;
    }
    setMobileNumber(cleaned);
    setIsVerified(true);
  };

  if (!isVotingActive) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-lg text-muted-foreground mb-2">
          {t('వోటింగ్ తెరవబడలేదు', 'Voting is not open')}
        </p>
        {game.voting_start && (
          <p className="text-sm text-muted-foreground">
            Starts: {format(new Date(game.voting_start), 'PPp')}
          </p>
        )}
        {game.voting_end && new Date() > new Date(game.voting_end) && (
          <p className="text-sm text-muted-foreground">
            Voting ended: {format(new Date(game.voting_end), 'PPp')}
          </p>
        )}
      </div>
    );
  }

  if (!isVerified) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <Phone className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('వోట్ చేయడానికి మొబైల్ నంబర్', 'Enter Mobile Number to Vote')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('ప్రతి నంబర్‌కు', 'You get')} {game.max_votes_per_mobile} {t('వోట్లు ఉన్నాయి', 'votes per mobile number')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter your mobile number"
                className="text-center text-lg"
              />
            </div>
            <Button onClick={handleVerify} className="w-full">
              <Vote className="h-4 w-4 mr-2" />
              {t('వోట్ చేయడం ప్రారంభించండి', 'Start Voting')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {t('మీకు', 'You have')} <strong>{remainingVotes}</strong> {t('వోట్లు మిగిలి ఉన్నాయి', 'votes remaining')}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIsVerified(false)}>
            Change Number
          </Button>
        </AlertDescription>
      </Alert>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('ఎంట్రీలు లేవు', 'No entries yet')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => {
            const hasVoted = votedEntries.includes(entry.id);
            
            return (
              <Card key={entry.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={entry.photo_url}
                    alt={`Entry ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 left-2">
                    #{index + 1}
                  </Badge>
                  {hasVoted && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="h-12 w-12 text-primary" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  {hasVoted ? (
                    <Button variant="secondary" className="w-full" disabled>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t('వోట్ చేసారు', 'Voted')}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => voteMutation.mutate(entry.id)}
                      disabled={remainingVotes <= 0 || voteMutation.isPending}
                    >
                      <Vote className="h-4 w-4 mr-2" />
                      {t('వోట్', 'Vote')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
