import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Upload, Link as LinkIcon, Hash, X, Image as ImageIcon, Video, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdatePost } from '../hooks/useQueries';
import { ExternalBlob, PaywallLink, PaywalledVideo } from '../backend';
import { useActor } from '../hooks/useActor';
import { isVideoFile } from '../lib/mediaUpload';
import type { Post } from '../types';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onPostUpdated: () => void;
}

export default function EditPostModal({ isOpen, onClose, post, onPostUpdated }: EditPostModalProps) {
  const [content, setContent] = useState(post.content);
  const [links, setLinks] = useState<string[]>(post.links.length > 0 ? post.links : ['']);
  const [hashtags, setHashtags] = useState<string[]>(post.tags.length > 0 ? post.tags : ['']);
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [newPublicVideoFiles, setNewPublicVideoFiles] = useState<File[]>([]);
  const [newPaywalledVideoFiles, setNewPaywalledVideoFiles] = useState<Array<{ file: File; price: string; description: string }>>([]);
  const [existingPaywalledVideos, setExistingPaywalledVideos] = useState<Array<PaywalledVideo & { index: number }>>(
    post.paywalledVideos.map((v, i) => ({ ...v, index: i }))
  );
  const [newPaywallLinks, setNewPaywallLinks] = useState<Array<{ url: string; price: string; description: string }>>([]);
  const [existingPaywallLinks, setExistingPaywallLinks] = useState<Array<PaywallLink & { index: number }>>(
    post.paywallLinks.map((l, i) => ({ ...l, index: i }))
  );
  const [isUploading, setIsUploading] = useState(false);

  const updatePost = useUpdatePost();
  const { actor } = useActor();

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewMediaFiles((prev) => [...prev, ...files]);
    }
  };

  const handlePublicVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => isVideoFile(f.name));
      setNewPublicVideoFiles((prev) => [...prev, ...files]);
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
      setNewPaywalledVideoFiles((prev) => [...prev, ...newPaywalledVideos]);
    }
  };

  const removeNewMedia = (index: number) => {
    setNewMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewPublicVideo = (index: number) => {
    setNewPublicVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewPaywalledVideo = (index: number) => {
    setNewPaywalledVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPaywalledVideo = (index: number) => {
    setExistingPaywalledVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNewPaywalledVideoPrice = (index: number, price: string) => {
    setNewPaywalledVideoFiles((prev) => prev.map((v, i) => i === index ? { ...v, price } : v));
  };

  const updateNewPaywalledVideoDescription = (index: number, description: string) => {
    setNewPaywalledVideoFiles((prev) => prev.map((v, i) => i === index ? { ...v, description } : v));
  };

  const updateExistingPaywalledVideoPrice = (index: number, price: string) => {
    setExistingPaywalledVideos((prev) => prev.map((v, i) => i === index ? { ...v, price: BigInt(Math.round(parseFloat(price) * 100000000)) } : v));
  };

  const updateExistingPaywalledVideoDescription = (index: number, description: string) => {
    setExistingPaywalledVideos((prev) => prev.map((v, i) => i === index ? { ...v, description } : v));
  };

  const addNewPaywallLink = () => {
    setNewPaywallLinks([...newPaywallLinks, { url: '', price: '0.01', description: '' }]);
  };

  const removeNewPaywallLink = (index: number) => {
    setNewPaywallLinks(newPaywallLinks.filter((_, i) => i !== index));
  };

  const removeExistingPaywallLink = (index: number) => {
    setExistingPaywallLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNewPaywallLink = (index: number, field: 'url' | 'price' | 'description', value: string) => {
    setNewPaywallLinks(newPaywallLinks.map((link, i) => i === index ? { ...link, [field]: value } : link));
  };

  const updateExistingPaywallLink = (index: number, field: 'url' | 'price' | 'description', value: string) => {
    setExistingPaywallLinks((prev) => prev.map((link, i) => {
      if (i === index) {
        if (field === 'price') {
          return { ...link, price: BigInt(Math.round(parseFloat(value) * 100000000)) };
        }
        return { ...link, [field]: value };
      }
      return link;
    }));
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
      // Upload new media files
      const uploadedMedia: ExternalBlob[] = [];
      for (const file of newMediaFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = await actor.uploadBlobWithName(uint8Array, file.name);
        uploadedMedia.push(blob);
      }

      // Upload new public videos
      const uploadedPublicVideos: ExternalBlob[] = [];
      for (const file of newPublicVideoFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = await actor.uploadBlobWithName(uint8Array, file.name);
        uploadedPublicVideos.push(blob);
      }

      // Upload new paywalled videos
      const uploadedPaywalledVideos: PaywalledVideo[] = [];
      for (const paywalledVideo of newPaywalledVideoFiles) {
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

      // Create new paywall links
      const validNewPaywallLinks: PaywallLink[] = newPaywallLinks
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

      // Filter out empty links and hashtags
      const validLinks = links.filter(link => link.trim() !== '');
      const validHashtags = hashtags.filter(tag => tag.trim() !== '');

      // Determine removed paywalled videos
      const removedPaywalledVideos = post.paywalledVideos.filter(
        (v, i) => !existingPaywalledVideos.some(ev => ev.index === i)
      ).map(v => v.blob);

      // Determine removed paywall links
      const removedPaywallLinks = post.paywallLinks.filter(
        (l, i) => !existingPaywallLinks.some(el => el.index === i)
      ).map(l => l.url);

      // Update post
      await updatePost.mutateAsync({
        postId: post.id,
        payload: {
          content,
          tags: validHashtags,
          addMedia: uploadedMedia.length > 0 ? uploadedMedia : undefined,
          addPublicVideos: uploadedPublicVideos.length > 0 ? uploadedPublicVideos : undefined,
          addPaywalledVideos: uploadedPaywalledVideos.length > 0 ? uploadedPaywalledVideos : undefined,
          addPaywallLinks: validNewPaywallLinks.length > 0 ? validNewPaywallLinks : undefined,
          removePaywalledVideos: removedPaywalledVideos.length > 0 ? removedPaywalledVideos : undefined,
          removePaywallLinks: removedPaywallLinks.length > 0 ? removedPaywallLinks : undefined,
          updatePaywalledVideos: existingPaywalledVideos.length > 0 ? existingPaywalledVideos.map(v => ({
            paywalledVideos: [{ blob: v.blob, price: v.price, description: v.description, isActive: v.isActive }],
            price: v.price,
            description: v.description,
            isActive: v.isActive
          })) : undefined,
        }
      });

      toast.success('Post updated successfully!');
      onPostUpdated();
      onClose();
    } catch (error: any) {
      console.error('Failed to update post:', error);
      toast.error(error.message || 'Failed to update post');
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = isUploading || updatePost.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-dark">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Post</DialogTitle>
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

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Add New Images</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="bg-card border-border"
                  disabled={isSubmitting}
                />
                {newMediaFiles.length > 0 && (
                  <div className="space-y-2">
                    {newMediaFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                        <span className="text-sm text-foreground truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNewMedia(index)}
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
                <Label className="text-foreground">Add New Public Videos</Label>
                <Input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handlePublicVideoUpload}
                  className="bg-card border-border"
                  disabled={isSubmitting}
                />
                {newPublicVideoFiles.length > 0 && (
                  <div className="space-y-2">
                    {newPublicVideoFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                        <span className="text-sm text-foreground truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNewPublicVideo(index)}
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
              {/* Existing Paywalled Videos */}
              {existingPaywalledVideos.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">Existing Paywalled Videos</Label>
                  <div className="space-y-3">
                    {existingPaywalledVideos.map((video, index) => (
                      <div key={index} className="p-3 bg-card rounded border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Video {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingPaywalledVideo(index)}
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
                              value={(Number(video.price) / 100000000).toFixed(8)}
                              onChange={(e) => updateExistingPaywalledVideoPrice(index, e.target.value)}
                              className="bg-background border-border"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={video.description}
                              onChange={(e) => updateExistingPaywalledVideoDescription(index, e.target.value)}
                              placeholder="Optional"
                              className="bg-background border-border"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Paywalled Videos */}
              <div className="space-y-2">
                <Label className="text-foreground">Add New Paywalled Videos</Label>
                <Input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handlePaywalledVideoUpload}
                  className="bg-card border-border"
                  disabled={isSubmitting}
                />
                {newPaywalledVideoFiles.length > 0 && (
                  <div className="space-y-3">
                    {newPaywalledVideoFiles.map((video, index) => (
                      <div key={index} className="p-3 bg-card rounded border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground truncate">{video.file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNewPaywalledVideo(index)}
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
                              onChange={(e) => updateNewPaywalledVideoPrice(index, e.target.value)}
                              className="bg-background border-border"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={video.description}
                              onChange={(e) => updateNewPaywalledVideoDescription(index, e.target.value)}
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

              {/* Existing Paywall Links */}
              {existingPaywallLinks.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">Existing Paywall Links</Label>
                  {existingPaywallLinks.map((link, index) => (
                    <div key={index} className="p-3 bg-card rounded border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Link {index + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExistingPaywallLink(index)}
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="https://example.com"
                        value={link.url}
                        onChange={(e) => updateExistingPaywallLink(index, 'url', e.target.value)}
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
                            value={(Number(link.price) / 100000000).toFixed(8)}
                            onChange={(e) => updateExistingPaywallLink(index, 'price', e.target.value)}
                            className="bg-background border-border"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={link.description}
                            onChange={(e) => updateExistingPaywallLink(index, 'description', e.target.value)}
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

              {/* New Paywall Links */}
              <div className="space-y-2">
                <Label className="text-foreground">Add New Paywall Links</Label>
                {newPaywallLinks.map((link, index) => (
                  <div key={index} className="p-3 bg-card rounded border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Link {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNewPaywallLink(index)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="https://example.com"
                      value={link.url}
                      onChange={(e) => updateNewPaywallLink(index, 'url', e.target.value)}
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
                          onChange={(e) => updateNewPaywallLink(index, 'price', e.target.value)}
                          className="bg-background border-border"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={link.description}
                          onChange={(e) => updateNewPaywallLink(index, 'description', e.target.value)}
                          placeholder="Optional"
                          className="bg-background border-border"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addNewPaywallLink} className="w-full" disabled={isSubmitting}>
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
                  {isUploading ? 'Uploading...' : 'Updating...'}
                </>
              ) : (
                'Update Post'
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
