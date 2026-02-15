import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Upload, Link as LinkIcon, Hash, X, Image as ImageIcon, Video, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePost, useUpdatePost } from '../hooks/useQueries';
import { ExternalBlob, PaywallLink, PaywalledVideo } from '../backend';
import { useActor } from '../hooks/useActor';
import { isVideoFile, isImageFile } from '../lib/mediaUpload';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [hashtags, setHashtags] = useState<string[]>(['']);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [publicVideoFiles, setPublicVideoFiles] = useState<File[]>([]);
  const [paywalledVideoFiles, setPaywalledVideoFiles] = useState<Array<{ file: File; price: string; description: string }>>([]);
  const [paywallLinks, setPaywallLinks] = useState<Array<{ url: string; price: string; description: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const { actor } = useActor();

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setMediaFiles((prev) => [...prev, ...files]);
    }
  };

  const handlePublicVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => isVideoFile(f.name));
      setPublicVideoFiles((prev) => [...prev, ...files]);
    }
  };

  const handlePaywalledVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => isVideoFile(f.name));
      const newPaywalledVideos = files.map(file => ({
        file,
        price: '0.01',
        description: ''
      }));
      setPaywalledVideoFiles((prev) => [...prev, ...newPaywalledVideos]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removePublicVideo = (index: number) => {
    setPublicVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removePaywalledVideo = (index: number) => {
    setPaywalledVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePaywalledVideoPrice = (index: number, price: string) => {
    setPaywalledVideoFiles((prev) => prev.map((v, i) => i === index ? { ...v, price } : v));
  };

  const updatePaywalledVideoDescription = (index: number, description: string) => {
    setPaywalledVideoFiles((prev) => prev.map((v, i) => i === index ? { ...v, description } : v));
  };

  const addPaywallLink = () => {
    setPaywallLinks([...paywallLinks, { url: '', price: '0.01', description: '' }]);
  };

  const removePaywallLink = (index: number) => {
    setPaywallLinks(paywallLinks.filter((_, i) => i !== index));
  };

  const updatePaywallLink = (index: number, field: 'url' | 'price' | 'description', value: string) => {
    setPaywallLinks(paywallLinks.map((link, i) => i === index ? { ...link, [field]: value } : link));
  };

  const addLink = () => setLinks([...links, '']);
  const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));
  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const addHashtag = () => setHashtags([...hashtags, '']);
  const removeHashtag = (index: number) => setHashtags(hashtags.filter((_, i) => i !== index));
  const updateHashtag = (index: number, value: string) => {
    const newHashtags = [...hashtags];
    newHashtags[index] = value.startsWith('#') ? value : `#${value}`;
    setHashtags(newHashtags);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (!actor) {
      toast.error('Actor not available');
      return;
    }

    setIsUploading(true);

    try {
      // Upload regular media files (images)
      const uploadedMedia: ExternalBlob[] = [];
      const fileNames: string[] = [];

      for (const file of mediaFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = await actor.uploadBlobWithName(uint8Array, file.name);
        uploadedMedia.push(blob);
        fileNames.push(file.name);
      }

      // Filter out empty links and hashtags
      const validLinks = links.filter(link => link.trim() !== '');
      const validHashtags = hashtags.filter(tag => tag.trim() !== '');

      // Create initial post
      const post = await createPost.mutateAsync({
        content,
        media: uploadedMedia,
        links: validLinks,
        tags: validHashtags,
        categories: [],
        fileNames,
      });

      // Upload public videos
      const uploadedPublicVideos: ExternalBlob[] = [];
      for (const file of publicVideoFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = await actor.uploadBlobWithName(uint8Array, file.name);
        uploadedPublicVideos.push(blob);
      }

      // Upload paywalled videos
      const uploadedPaywalledVideos: PaywalledVideo[] = [];
      for (const paywalledVideo of paywalledVideoFiles) {
        const arrayBuffer = await paywalledVideo.file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = await actor.uploadBlobWithName(uint8Array, paywalledVideo.file.name);
        
        const priceICP = parseFloat(paywalledVideo.price);
        const priceE8s = BigInt(Math.round(priceICP * 100000000));
        
        uploadedPaywalledVideos.push({
          blob,
          price: priceE8s,
          description: paywalledVideo.description,
          isActive: true
        });
      }

      // Create paywall links
      const validPaywallLinks: PaywallLink[] = paywallLinks
        .filter(link => link.url.trim() !== '')
        .map(link => {
          const priceICP = parseFloat(link.price);
          const priceE8s = BigInt(Math.round(priceICP * 100000000));
          return {
            url: link.url,
            price: priceE8s,
            description: link.description,
            isActive: true
          };
        });

      // Update post with videos and paywall content if any
      if (uploadedPublicVideos.length > 0 || uploadedPaywalledVideos.length > 0 || validPaywallLinks.length > 0) {
        await updatePost.mutateAsync({
          postId: post.id,
          payload: {
            addPublicVideos: uploadedPublicVideos.length > 0 ? uploadedPublicVideos : undefined,
            addPaywalledVideos: uploadedPaywalledVideos.length > 0 ? uploadedPaywalledVideos : undefined,
            addPaywallLinks: validPaywallLinks.length > 0 ? validPaywallLinks : undefined,
          }
        });
      }

      toast.success('Post created successfully!');
      
      // Reset form
      setContent('');
      setLinks(['']);
      setHashtags(['']);
      setMediaFiles([]);
      setPublicVideoFiles([]);
      setPaywalledVideoFiles([]);
      setPaywallLinks([]);
      
      onPostCreated();
      onClose();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = isUploading || createPost.isPending || updatePost.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-dark">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-foreground">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="bg-card border-border"
              disabled={isSubmitting}
            />
          </div>

          {/* Tabs for different content types */}
          <Tabs defaultValue="media" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="media">
                <ImageIcon className="w-4 h-4 mr-1" />
                Images
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Video className="w-4 h-4 mr-1" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="paywall">
                <Lock className="w-4 h-4 mr-1" />
                Paywall
              </TabsTrigger>
              <TabsTrigger value="metadata">
                <Hash className="w-4 h-4 mr-1" />
                Links & Tags
              </TabsTrigger>
            </TabsList>

            {/* Regular Media Tab */}
            <TabsContent value="media" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Upload Images</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMediaUpload}
                    className="bg-card border-border"
                    disabled={isSubmitting}
                  />
                  <Button type="button" variant="outline" size="icon" disabled={isSubmitting}>
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {mediaFiles.length > 0 && (
                  <div className="space-y-2">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                        <span className="text-sm text-foreground truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedia(index)}
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Upload Public Videos</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handlePublicVideoUpload}
                    className="bg-card border-border"
                    disabled={isSubmitting}
                  />
                  <Button type="button" variant="outline" size="icon" disabled={isSubmitting}>
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {publicVideoFiles.length > 0 && (
                  <div className="space-y-2">
                    {publicVideoFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                        <span className="text-sm text-foreground truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePublicVideo(index)}
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Paywall Tab */}
            <TabsContent value="paywall" className="space-y-4">
              {/* Paywalled Videos */}
              <div className="space-y-2">
                <Label className="text-foreground">Paywalled Videos</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handlePaywalledVideoUpload}
                    className="bg-card border-border"
                    disabled={isSubmitting}
                  />
                  <Button type="button" variant="outline" size="icon" disabled={isSubmitting}>
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {paywalledVideoFiles.length > 0 && (
                  <div className="space-y-3">
                    {paywalledVideoFiles.map((video, index) => (
                      <div key={index} className="p-3 bg-card rounded border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground truncate">{video.file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePaywalledVideo(index)}
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Price (ICP)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={video.price}
                              onChange={(e) => updatePaywalledVideoPrice(index, e.target.value)}
                              className="bg-background border-border"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={video.description}
                              onChange={(e) => updatePaywalledVideoDescription(index, e.target.value)}
                              placeholder="Optional"
                              className="bg-background border-border"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Paywall Links */}
              <div className="space-y-2">
                <Label className="text-foreground">Paywall Links</Label>
                {paywallLinks.map((link, index) => (
                  <div key={index} className="p-3 bg-card rounded border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Link {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaywallLink(index)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="https://example.com"
                      value={link.url}
                      onChange={(e) => updatePaywallLink(index, 'url', e.target.value)}
                      className="bg-background border-border"
                      disabled={isSubmitting}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Price (ICP)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={link.price}
                          onChange={(e) => updatePaywallLink(index, 'price', e.target.value)}
                          className="bg-background border-border"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={link.description}
                          onChange={(e) => updatePaywallLink(index, 'description', e.target.value)}
                          placeholder="Optional"
                          className="bg-background border-border"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addPaywallLink} className="w-full" disabled={isSubmitting}>
                  <Lock className="w-4 h-4 mr-2" />
                  Add Paywall Link
                </Button>
              </div>
            </TabsContent>

            {/* Metadata Tab */}
            <TabsContent value="metadata" className="space-y-4">
              {/* Links */}
              <div className="space-y-2">
                <Label className="text-foreground">Links</Label>
                {links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="https://example.com"
                      value={link}
                      onChange={(e) => updateLink(index, e.target.value)}
                      className="bg-card border-border"
                      disabled={isSubmitting}
                    />
                    {links.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLink(index)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addLink} className="w-full" disabled={isSubmitting}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </div>

              {/* Hashtags */}
              <div className="space-y-2">
                <Label className="text-foreground">Hashtags</Label>
                {hashtags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="#hashtag"
                      value={tag}
                      onChange={(e) => updateHashtag(index, e.target.value)}
                      className="bg-card border-border"
                      disabled={isSubmitting}
                    />
                    {hashtags.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHashtag(index)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addHashtag} className="w-full" disabled={isSubmitting}>
                  <Hash className="w-4 h-4 mr-2" />
                  Add Hashtag
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                'Create Post'
              )}
            </Button>
            <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
