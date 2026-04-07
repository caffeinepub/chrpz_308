import { DollarSign } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import TipModal from "./TipModal";
import { Button } from "./ui/button";

interface TipButtonProps {
  postId: bigint;
  tipCount: number;
}

export default function TipButton({ postId, tipCount }: TipButtonProps) {
  const [showTipModal, setShowTipModal] = useState(false);
  const { identity } = useInternetIdentity();

  const handleClick = () => {
    if (!identity) {
      toast.error("Please sign in to send tips");
      return;
    }
    setShowTipModal(true);
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleClick}>
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
