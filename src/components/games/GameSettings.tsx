import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGame, deleteGame, type Game } from '@/lib/games';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Save, Trash2 } from 'lucide-react';

interface GameSettingsProps {
  game: Game;
}

export function GameSettings({ game }: GameSettingsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const [name, setName] = useState(game.name);
  const [description, setDescription] = useState(game.description || '');
  const [photoInstructions, setPhotoInstructions] = useState(game.photo_instructions || '');
  const [maxVotes, setMaxVotes] = useState(game.max_votes_per_mobile.toString());
  const [votingStart, setVotingStart] = useState(
    game.voting_start ? new Date(game.voting_start).toISOString().slice(0, 16) : ''
  );
  const [votingEnd, setVotingEnd] = useState(
    game.voting_end ? new Date(game.voting_end).toISOString().slice(0, 16) : ''
  );

  const updateMutation = useMutation({
    mutationFn: () => updateGame(game.id, {
      name,
      description: description || null,
      photo_instructions: photoInstructions || null,
      max_votes_per_mobile: parseInt(maxVotes) || 5,
      voting_start: votingStart ? new Date(votingStart).toISOString() : null,
      voting_end: votingEnd ? new Date(votingEnd).toISOString() : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] });
      toast({ title: 'Settings Updated', description: 'Game settings saved successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGame(game.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast({ title: 'Game Deleted', description: 'The game has been deleted' });
      navigate(`/org/${currentOrganization?.slug}/games`);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete game', variant: 'destructive' });
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Settings</CardTitle>
          <CardDescription>Update game details and voting configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Game Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoInstructions">Photo Instructions</Label>
            <Textarea
              id="photoInstructions"
              value={photoInstructions}
              onChange={(e) => setPhotoInstructions(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxVotes">Votes Per Mobile Number</Label>
            <Input
              id="maxVotes"
              type="number"
              min="1"
              max="20"
              value={maxVotes}
              onChange={(e) => setMaxVotes(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="votingStart">Voting Starts</Label>
              <Input
                id="votingStart"
                type="datetime-local"
                value={votingStart}
                onChange={(e) => setVotingStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="votingEnd">Voting Ends</Label>
              <Input
                id="votingEnd"
                type="datetime-local"
                value={votingEnd}
                onChange={(e) => setVotingEnd(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Game
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the game and all its entries and votes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
