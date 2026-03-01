import React from 'react';
import { ExternalLink, Hash } from 'lucide-react';
import { Badge } from './ui/badge';

interface PostMetadataProps {
  links: string[];
  tags: string[];
}

export default function PostMetadata({ links, tags }: PostMetadataProps) {
  if (links.length === 0 && tags.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              {link}
            </a>
          ))}
        </div>
      )}

      {/* Tags/Hashtags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              <Hash className="w-3 h-3 mr-1" />
              {tag.replace('#', '')}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
