import { type GameEntry } from '@/lib/games';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface EntriesGridProps {
  entries: GameEntry[];
  showDetails: boolean;
  showVotes: boolean;
}

export function EntriesGrid({ entries, showDetails, showVotes }: EntriesGridProps) {
  const { t } = useLanguage();

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('ఎంట్రీలు లేవు', 'No entries yet')}</p>
      </div>
    );
  }

  // Sort by vote count for results
  const sortedEntries = [...entries].sort((a, b) => b.vote_count - a.vote_count);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedEntries.map((entry, index) => (
        <Card key={entry.id} className="overflow-hidden">
          <div className="relative aspect-square">
            <img
              src={entry.photo_url}
              alt={showDetails ? entry.participant_name : `Entry ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 flex items-center gap-2">
              {getRankIcon(index)}
              <Badge variant={index < 3 ? 'default' : 'secondary'}>
                #{index + 1}
              </Badge>
            </div>
            {showVotes && (
              <Badge className="absolute top-2 right-2 bg-primary">
                {entry.vote_count} {t('వోట్లు', 'votes')}
              </Badge>
            )}
          </div>
          <CardContent className="p-4">
            {showDetails ? (
              <div>
                <h4 className="font-semibold">{entry.participant_name}</h4>
                {entry.participant_details && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {entry.participant_details}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t('వివరాలు దాచబడ్డాయి', 'Details hidden until reveal')}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
