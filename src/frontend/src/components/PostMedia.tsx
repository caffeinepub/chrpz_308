import React from 'react';
import { ExternalBlob } from '../backend';

interface PostMediaProps {
  media: ExternalBlob[];
  videos: ExternalBlob[];
}

export default function PostMedia({ media, videos }: PostMediaProps) {
  if (media.length === 0 && videos.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Images */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {media.map((blob, index) => (
            <div key={index} className="rounded-lg overflow-hidden border border-border">
              <img
                src={blob.getDirectURL()}
                alt={`Media ${index + 1}`}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((blob, index) => (
            <div key={index} className="rounded-lg overflow-hidden border border-border">
              <video
                src={blob.getDirectURL()}
                controls
                className="w-full h-auto"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
