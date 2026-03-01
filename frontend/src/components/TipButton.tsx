import React, { useState } from 'react';
import { Button } from './ui/button';
import { DollarSign } from 'lucide-react';
import TipModal from './TipModal';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface TipButtonProps {
  postId: bigint;
  tipCount: number;
}

export default function TipButton({ postId, tipCount }: TipButtonProps) {
  const [showTipModal, setShowTipModal] = useState(false);
  const { identity } = useInternetIdentity();

  const handleClick = () => {
    if (!identity) {
      toast.error('Please sign in to send tips');
      return;
    }
    setShowTipModal(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
      >
        <DollarSign className="w-4 h-4 mr-2" />
        {tipCount}
      </Button>

      {showTipModal && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          postId={postId}
        />
      )}
    </>
  );
}
