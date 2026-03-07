'use client';

import { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShareableSkillsCard } from './ShareableSkillsCard';
import { SkillsProfile, LearnerRole } from '@/lib/types';
import { Download, Check } from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skills: SkillsProfile;
  completedModules: number;
  totalModules: number;
  streakDays: number;
  totalMinutesLearned: number;
  role: LearnerRole | null;
}

export function ShareDialog({
  open,
  onOpenChange,
  ...cardProps
}: ShareDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = 'claude-learn-skills.png';
      link.href = dataUrl;
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogTitle>Share Your Skills</DialogTitle>
        <DialogDescription>
          Download your skills card as an image to share your progress.
        </DialogDescription>

        <div className="flex justify-center py-4">
          <ShareableSkillsCard ref={cardRef} {...cardProps} />
        </div>

        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full gap-2"
        >
          {downloaded ? (
            <>
              <Check className="h-4 w-4" />
              Downloaded!
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {downloading ? 'Generating...' : 'Download as PNG'}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
