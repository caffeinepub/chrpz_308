import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Copy,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  Wallet,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddToken,
  useGetCallerImportedTokens,
  useGetCallerUserProfile,
  useGetCallerWallet,
  useRemoveToken,
} from "../hooks/useQueries";
import { ensureValidAccountId } from "../lib/accountId";
import Header from "./Header";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function WalletDashboard() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const {
    data: wallet,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useGetCallerWallet();
  const { data: importedTokens = [], refetch: refetchTokens } =
    useGetCallerImportedTokens();

  const addTokenMutation = useAddToken();
  const removeTokenMutation = useRemoveToken();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [tokenCanisterId, setTokenCanisterId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [validAccountId, setValidAccountId] = useState<string>("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Ensure account ID is valid
  useEffect(() => {
    if (wallet?.accountId && identity) {
      ensureValidAccountId(wallet.accountId, identity.getPrincipal()).then(
        setValidAccountId,
      );
    }
  }, [wallet?.accountId, identity]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const generateQRCode = (text: string) => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    const padding = 20;
    const gridSize = 8;
    const cellSize = (size - padding * 2) / gridSize;

    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#000000";
    ctx.fillRect(
      padding - 5,
      padding - 5,
      size - padding * 2 + 10,
      size - padding * 2 + 10,
    );

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(padding, padding, size - padding * 2, size - padding * 2);

    ctx.fillStyle = "#000000";
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const charCode = text.charCodeAt((i * gridSize + j) % text.length);
        if (charCode % 2 === 0) {
          ctx.fillRect(
            padding + j * cellSize,
            padding + i * cellSize,
            cellSize - 2,
            cellSize - 2,
          );
        }
      }
    }

    const markerSize = cellSize * 2;
    const drawMarker = (x: number, y: number) => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, markerSize, markerSize);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(
        x + cellSize / 2,
        y + cellSize / 2,
        markerSize - cellSize,
        markerSize - cellSize,
      );
      ctx.fillStyle = "#000000";
      ctx.fillRect(x + cellSize, y + cellSize, cellSize / 2, cellSize / 2);
    };

    drawMarker(padding, padding);
    drawMarker(size - padding - markerSize, padding);
    drawMarker(padding, size - padding - markerSize);
  };

  const generateQRCodeRef = useRef(generateQRCode);
  generateQRCodeRef.current = generateQRCode;

  useEffect(() => {
    if (showReceiveModal && validAccountId) {
      generateQRCodeRef.current(validAccountId);
    }
  }, [showReceiveModal, validAccountId]);

  const handleShowReceive = () => {
    if (validAccountId) {
      setShowReceiveModal(true);
    }
  };

  const validateCanisterId = (canisterId: string): boolean => {
    const canisterIdRegex =
      /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/;
    return canisterIdRegex.test(canisterId.trim());
  };

  const handleImportToken = async () => {
    const trimmedCanisterId = tokenCanisterId.trim();

    if (!trimmedCanisterId) {
      toast.error("Please enter a token canister ID");
      return;
    }

    if (!validateCanisterId(trimmedCanisterId)) {
      toast.error(
        "Invalid canister ID format. Expected format: xxxxx-xxxxx-xxxxx-xxxxx-xxx",
      );
      return;
    }

    const alreadyImported = importedTokens.includes(trimmedCanisterId);
    if (alreadyImported) {
      toast.error("This token is already imported");
      return;
    }

    setIsImporting(true);

    try {
      await addTokenMutation.mutateAsync(trimmedCanisterId);

      toast.success(
        "Token imported successfully! You can now use it for tipping.",
      );

      await refetchTokens();

      setShowImportModal(false);
      setTokenCanisterId("");
    } catch (error: any) {
      console.error("Import token error:", error);
      toast.error(error.message || "Failed to import token");
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemoveToken = async (canisterId: string) => {
    try {
      await removeTokenMutation.mutateAsync(canisterId);
      toast.success("Token removed successfully");
      await refetchTokens();
    } catch (error: any) {
      console.error("Remove token error:", error);
      toast.error(error.message || "Failed to remove token");
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchWallet(), refetchTokens()]);
      toast.success("Wallet refreshed");
    } catch (_error) {
      toast.error("Failed to refresh wallet");
    }
  };

  if (!identity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6 max-w-4xl">
          <Alert className="glass-dark border-2">
            <AlertDescription>
              Please sign in to view your wallet
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isLoading = profileLoading || walletLoading;
  const displayAccountId = validAccountId || wallet?.accountId || "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ICP Wallet
            </h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {isLoading ? (
          <Card className="glass-dark border-2">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading wallet...</p>
            </CardContent>
          </Card>
        ) : wallet ? (
          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="wallet">
                <Wallet className="w-4 h-4 mr-2" />
                Wallet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet" className="space-y-6">
              {/* Balance Card */}
              <Card className="glass-dark border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Wallet className="w-5 h-5 text-primary" />
                    Wallet Balance
                  </CardTitle>
                  <CardDescription>Your ICP token balance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-6 rounded-lg bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">
                      Available Balance
                    </p>
                    <p className="text-4xl font-bold text-foreground">
                      {(Number(wallet.balance) / 100000000).toFixed(8)} ICP
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleShowReceive}
                  className="h-auto py-6 flex flex-col items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <QrCode className="w-8 h-8" />
                  <span className="text-lg font-semibold">
                    Receive ICP/Tokens
                  </span>
                  <span className="text-xs opacity-80">
                    Show address & QR code
                  </span>
                </Button>

                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center gap-2 border-2"
                >
                  <Plus className="w-8 h-8" />
                  <span className="text-lg font-semibold">Import Token</span>
                  <span className="text-xs opacity-80">
                    Add custom token for tipping
                  </span>
                </Button>
              </div>

              {/* Import Token Section */}
              <Card className="glass-dark border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plus className="w-5 h-5 text-primary" />
                    Import Token
                  </CardTitle>
                  <CardDescription>
                    Add custom tokens to use for tipping
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label
                        htmlFor="canister-id-inline"
                        className="text-sm text-muted-foreground mb-2 block"
                      >
                        Canister ID
                      </Label>
                      <Input
                        id="canister-id-inline"
                        value={tokenCanisterId}
                        onChange={(e) => setTokenCanisterId(e.target.value)}
                        placeholder="egjwt-lqaaa-aaaak-qi2aa-cai"
                        className="bg-card border-border font-mono text-sm"
                        disabled={isImporting}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleImportToken}
                        disabled={isImporting || !tokenCanisterId.trim()}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a valid token canister ID (format:
                    xxxxx-xxxxx-xxxxx-xxxxx-xxx) to import it for tipping
                  </p>
                </CardContent>
              </Card>

              {/* Imported Tokens */}
              {importedTokens.length > 0 && (
                <Card className="glass-dark border-2">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Imported Tokens
                    </CardTitle>
                    <CardDescription>
                      Your custom tokens available for tipping (
                      {importedTokens.length})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {importedTokens.map((canisterId) => (
                        <div
                          key={canisterId}
                          className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                Token
                              </p>
                              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500 font-medium">
                                Available for Tipping
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              {canisterId}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Use this token when tipping posts
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveToken(canisterId)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Account Details */}
              <Card className="glass-dark border-2">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Account Details
                  </CardTitle>
                  <CardDescription>Your ICP wallet identifiers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Account ID (AID)
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background/50 p-3 rounded border border-border font-mono break-all">
                        {displayAccountId}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(displayAccountId, "Account ID")
                        }
                        className="shrink-0"
                      >
                        {copiedField === "Account ID" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      64-character hexadecimal ICP account identifier for
                      receiving tokens
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Principal ID (PID)
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background/50 p-3 rounded border border-border font-mono break-all">
                        {profile?.principalId ||
                          identity.getPrincipal().toString()}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            profile?.principalId ||
                              identity.getPrincipal().toString(),
                            "Principal ID",
                          )
                        }
                        className="shrink-0"
                      >
                        {copiedField === "Principal ID" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your unique Internet Computer identity
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              {wallet.transactionHistory.length > 0 && (
                <Card className="glass-dark border-2">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Recent Transactions
                    </CardTitle>
                    <CardDescription>
                      Your latest wallet activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {wallet.transactionHistory
                        .slice(-10)
                        .reverse()
                        .map((tx, index) => (
                          <div
                            key={`${tx.timestamp.toString()}-${index}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {tx.sender.toString() ===
                                identity.getPrincipal().toString()
                                  ? "Sent"
                                  : "Received"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  Number(tx.timestamp) / 1000000,
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-sm font-bold ${tx.sender.toString() === identity.getPrincipal().toString() ? "text-red-500" : "text-green-500"}`}
                              >
                                {tx.sender.toString() ===
                                identity.getPrincipal().toString()
                                  ? "-"
                                  : "+"}
                                {(Number(tx.amount) / 100000000).toFixed(8)}{" "}
                                {tx.tokenType}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Alert className="glass-dark border-2">
            <AlertDescription>
              Wallet not found. Your ICP wallet is automatically created upon
              registration approval.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Receive Modal */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent className="sm:max-w-md glass-dark border-2">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Receive ICP/Tokens
            </DialogTitle>
            <DialogDescription>
              Share your Account ID or scan the QR code to receive tokens
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <canvas ref={qrCanvasRef} className="max-w-full h-auto" />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Your Account ID (AID)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background/50 p-3 rounded border border-border font-mono break-all">
                  {displayAccountId}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    displayAccountId &&
                    copyToClipboard(displayAccountId, "Account ID")
                  }
                  className="shrink-0"
                >
                  {copiedField === "Account ID" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Alert className="glass-dark border-2 border-primary/50">
              <AlertDescription className="text-sm">
                This is your unique ICP Account ID. Share it with others to
                receive ICP tokens or other ICRC-1 compatible tokens.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => setShowReceiveModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Token Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-md glass-dark border-2">
          <DialogHeader>
            <DialogTitle className="text-foreground">Import Token</DialogTitle>
            <DialogDescription>
              Add a custom token to your wallet by entering its canister ID
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="canister-id" className="text-foreground">
                Token Canister ID *
              </Label>
              <Input
                id="canister-id"
                value={tokenCanisterId}
                onChange={(e) => setTokenCanisterId(e.target.value)}
                placeholder="egjwt-lqaaa-aaaak-qi2aa-cai"
                className="bg-card border-border font-mono text-sm"
                disabled={isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Enter the canister ID of the token (format:
                xxxxx-xxxxx-xxxxx-xxxxx-xxx)
              </p>
            </div>

            <Alert className="glass-dark border-2 border-blue-500/50">
              <AlertDescription className="text-sm">
                <strong>How it works:</strong> The token will be added to your
                wallet and made available for tipping. You can use any imported
                token when tipping posts.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={handleImportToken}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                disabled={isImporting}
              >
                {isImporting ? "Importing..." : "Import Token"}
              </Button>
              <Button
                onClick={() => {
                  setShowImportModal(false);
                  setTokenCanisterId("");
                }}
                variant="outline"
                className="flex-1"
                disabled={isImporting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
