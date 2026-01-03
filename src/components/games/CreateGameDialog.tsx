import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGame } from '@/lib/games';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CreateGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  festivalId: string;
  organizationId: string;
}

const categories = [
  'Muggulu',
  'Rangoli',
  'Decoration',
  'Cooking',
  'Dress',
  'Dance',
  'Singing',
  'Art',
  'Other'
];

export function CreateGameDialog({ open, onOpenChange, festivalId, organizationId }: CreateGameDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photoInstructions, setPhotoInstructions] = useState('');
  const [maxVotes, setMaxVotes] = useState('5');
  const [votingStart, setVotingStart] = useState('');
  const [votingEnd, setVotingEnd] = useState('');

  const createMutation = useMutation({
    mutationFn: () => createGame({
      festival_id: festivalId,
      organization_id: organizationId,
      name,
      category,
      description: description || null,
      photo_instructions: photoInstructions || null,
      voting_start: votingStart ? new Date(votingStart).toISOString() : null,
      voting_end: votingEnd ? new Date(votingEnd).toISOString() : null,
      details_revealed: false,
      status: 'active',
      max_votes_per_mobile: parseInt(maxVotes) || 5
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', festivalId] });
      toast({ title: 'Game Created', description: 'Competition created successfully' });
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create game', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setPhotoInstructions('');
    setMaxVotes('5');
    setVotingStart('');
    setVotingEnd('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
      toast({ title: 'Error', description: 'Name and category are required', variant: 'destructive' });
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
          <DialogDescription>
            Set up a photo competition for your festival
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Game Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Muggulu Potilu 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the competition rules"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoInstructions">Photo Instructions</Label>
            <Textarea
              id="photoInstructions"
              value={photoInstructions}
              onChange={(e) => setPhotoInstructions(e.target.value)}
              placeholder="Instructions for participants submitting photos"
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

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Game
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
