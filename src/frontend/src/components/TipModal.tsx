import { DollarSign, Info, Loader2, Wallet } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  useGetCallerImportedTokens,
  useGetCallerWallet,
  useTipPost,
} from "../hooks/useQueries";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: bigint;
}

export default function TipModal({ isOpen, onClose, postId }: TipModalProps) {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<string>("ICP");
  const tipPost = useTipPost();
  const { data: wallet } = useGetCallerWallet();
  const { data: importedTokens = [] } = useGetCallerImportedTokens();

  // Get balance for selected token
  const getSelectedTokenBalance = () => {
    if (selectedToken === "ICP") {
      return wallet?.balance || BigInt(0);
    }
    // For imported tokens, we don't have balance info from backend yet
    // Return 0 for now
    return BigInt(0);
  };

  // Get decimals for selected token (default to 8 for all tokens)
  const getSelectedTokenDecimals = () => {
    return 8;
  };

  // Get token display name
  const getTokenDisplayName = () => {
    if (selectedToken === "ICP") {
      return "ICP";
    }
    // For imported tokens, show the canister ID
    return selectedToken;
  };

  const balance = getSelectedTokenBalance();
  const decimals = getSelectedTokenDecimals();
  const tokenDisplayName = getTokenDisplayName();
  const balanceDisplay = Number(balance) / 10 ** decimals;

  const handleSendTip = async () => {
    const tipAmount = Number.parseFloat(amount);
    if (Number.isNaN(tipAmount) || tipAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const tipAmountSmallestUnit = BigInt(
      Math.floor(tipAmount * 10 ** decimals),
    );

    // Only check balance for ICP (we don't have balance info for imported tokens yet)
    if (selectedToken === "ICP" && tipAmountSmallestUnit > balance) {
      toast.error("Insufficient ICP balance");
      return;
    }

    try {
      // Send tip with token type (canister ID for imported tokens, "ICP" for ICP)
      await tipPost.mutateAsync({
        postId,
        amount: tipAmountSmallestUnit,
        tokenType: selectedToken,
      });
      toast.success(`Tip sent successfully with ${tokenDisplayName}!`);
      setAmount("");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to send tip");
    }
  };

  const quickAmounts = [0.1, 0.5, 1, 5];

  // Build token options
  const tokenOptions = [
    {
      value: "ICP",
      label: "ICP (Internet Computer)",
      balance: wallet?.balance || BigInt(0),
      decimals: 8,
    },
    ...importedTokens.map((canisterId) => ({
      value: canisterId,
      label: canisterId,
      balance: BigInt(0), // Balance not available yet
      decimals: 8,
    })),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-dark border-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <DollarSign className="w-5 h-5" />
            Send Tip
          </DialogTitle>
          <DialogDescription>
            Support the creator with crypto tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token Selection */}
          <div className="space-y-2">
            <Label htmlFor="token" className="text-foreground">
              Select Token
            </Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokenOptions.map((token) => (
                  <SelectItem key={token.value} value={token.value}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium text-sm">{token.label}</span>
                      {token.value === "ICP" && (
                        <span className="text-xs text-muted-foreground">
                          {(
                            Number(token.balance) /
                            10 ** token.decimals
                          ).toFixed(token.decimals)}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedToken === "ICP" && (
            <Alert className="glass-dark border-2 border-primary/50">
              <Wallet className="w-4 h-4 text-primary" />
              <AlertDescription>
                <strong>Your Balance:</strong>{" "}
                {balanceDisplay.toFixed(decimals)} {tokenDisplayName}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="glass-dark border-2 border-blue-500/50">
            <Info className="w-4 h-4 text-blue-500" />
            <AlertDescription className="text-xs">
              <strong>Tipping with Tokens:</strong> You can tip with ICP or any
              imported token. The recipient will receive the token in their
              wallet.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Amount ({tokenDisplayName === "ICP" ? "ICP" : "tokens"})
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-card border-border"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                onClick={() => setAmount(quickAmount.toString())}
                className="text-xs"
              >
                {quickAmount}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendTip}
              disabled={tipPost.isPending || !amount}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {tipPost.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Tip"
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={tipPost.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
