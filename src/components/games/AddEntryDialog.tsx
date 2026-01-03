import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createGameEntry } from '@/lib/games';
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
import { Loader2, Upload, X } from 'lucide-react';

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
}

export function AddEntryDialog({ open, onOpenChange, gameId }: AddEntryDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [participantName, setParticipantName] = useState('');
  const [participantDetails, setParticipantDetails] = useState('');
  const [participantMobile, setParticipantMobile] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<{ url: string; path: string } | null> => {
    if (!photoFile) return null;
    
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${gameId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('user-images')
      .upload(fileName, photoFile);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('user-images')
      .getPublicUrl(fileName);
    
    return { url: data.publicUrl, path: fileName };
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      const photo = await uploadPhoto();
      if (!photo) throw new Error('Photo is required');
      
      return createGameEntry({
        game_id: gameId,
        photo_url: photo.url,
        photo_path: photo.path,
        participant_name: participantName,
        participant_details: participantDetails || null,
        participant_mobile: participantMobile || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-entries', gameId] });
      toast({ title: 'Entry Added', description: 'Participant entry added successfully' });
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add entry', variant: 'destructive' });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const resetForm = () => {
    setParticipantName('');
    setParticipantDetails('');
    setParticipantMobile('');
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName || !photoFile) {
      toast({ title: 'Error', description: 'Name and photo are required', variant: 'destructive' });
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Entry</DialogTitle>
          <DialogDescription>
            Add a participant to this competition
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Photo *</Label>
            {photoPreview ? (
              <div className="relative">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="participantName">Participant Name *</Label>
            <Input
              id="participantName"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Name (hidden during voting)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participantDetails">Details</Label>
            <Textarea
              id="participantDetails"
              value={participantDetails}
              onChange={(e) => setParticipantDetails(e.target.value)}
              placeholder="Additional details about the participant"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participantMobile">Mobile Number</Label>
            <Input
              id="participantMobile"
              value={participantMobile}
              onChange={(e) => setParticipantMobile(e.target.value)}
              placeholder="For contact purposes"
            />
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending || isUploading}>
            {(createMutation.isPending || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Entry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
