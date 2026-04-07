import { Loader2, Upload, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { isVideoFile } from "../lib/mediaUpload";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface VideoPaywallUploaderProps {
  onVideoAdded: (file: File, price: number, description: string) => void;
  disabled?: boolean;
}

export default function VideoPaywallUploader({
  onVideoAdded,
  disabled,
}: VideoPaywallUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [price, setPrice] = useState("0.01");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];

      if (!isVideoFile(file.name)) {
        toast.error("Please select a valid video file (mp4, mov, webm)");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleAdd = () => {
    if (!selectedFile) {
      toast.error("Please select a video file");
      return;
    }

    const priceNum = Number.parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsProcessing(true);
    try {
      onVideoAdded(selectedFile, priceNum, description);

      // Reset form
      setSelectedFile(null);
      setPrice("0.01");
      setDescription("");

      toast.success("Video added to paywall");
    } catch (error: any) {
      toast.error(error.message || "Failed to add video");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPrice("0.01");
    setDescription("");
  };

  return (
    <Card className="border-2 border-amber-500/30 bg-amber-950/10">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Select Video File</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="bg-card border-border"
              disabled={disabled || isProcessing}
            />
            {selectedFile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                disabled={disabled || isProcessing}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Price (ICP)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.01"
              className="bg-card border-border"
              disabled={disabled || isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Description (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Premium content"
              className="bg-card border-border"
              disabled={disabled || isProcessing}
            />
          </div>
        </div>

        <Button
          onClick={handleAdd}
          disabled={!selectedFile || disabled || isProcessing}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Add Paywalled Video
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
