/**
 * Client-side blob caching utility using Cache API
 * Provides persistent caching and revalidation for ExternalBlob URLs
 */

const CACHE_NAME = 'media-blob-cache-v4';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheMetadata {
  url: string;
  timestamp: number;
  size?: number;
}

/**
 * Initialize cache and clean up expired entries
 */
export async function initBlobCache(): Promise<void> {
  try {
    if (!('caches' in window)) {
      console.warn('Cache API not available');
      return;
    }

    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();

    for (const request of keys) {
      try {
        const response = await cache.match(request);
        if (response) {
          const metadata = await response.clone().json().catch(() => null);
          if (metadata?.timestamp && now - metadata.timestamp > CACHE_EXPIRY_MS) {
            await cache.delete(request);
          }
        }
      } catch (error) {
        console.warn('Error cleaning cache entry:', error);
      }
    }
  } catch (error) {
    console.error('Failed to initialize blob cache:', error);
  }
}

/**
 * Get cached blob URL or fetch and cache it with enhanced retry logic
 */
export async function getCachedBlobUrl(
  directUrl: string,
  options?: {
    forceRefresh?: boolean;
    onProgress?: (loaded: number, total: number) => void;
    maxRetries?: number;
  }
): Promise<string> {
  const maxRetries = options?.maxRetries ?? 5;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (!('caches' in window)) {
        return directUrl;
      }

      const cache = await caches.open(CACHE_NAME);
      const cacheKey = new Request(directUrl);

      if (!options?.forceRefresh && attempt === 0) {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          try {
            const blob = await cachedResponse.blob();
            if (blob.size > 0) {
              const blobUrl = URL.createObjectURL(blob);
              return blobUrl;
            }
          } catch (error) {
            console.warn('Cached blob invalid, refetching:', error);
            await cache.delete(cacheKey);
          }
        }
      }

      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(directUrl, {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Received empty blob');
        }

        const blobUrl = URL.createObjectURL(blob);

        const responseClone = new Response(blob, {
          headers: {
            'Content-Type': blob.type || 'application/octet-stream',
          },
        });
        
        cache.put(cacheKey, responseClone).catch((error) => {
          console.warn('Failed to cache blob:', error);
        });

        return blobUrl;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed for ${directUrl}:`, error);
    }
  }

  console.error(`All ${maxRetries} attempts failed for ${directUrl}`);
  return directUrl;
}

/**
 * Clear all cached blobs
 */
export async function clearBlobCache(): Promise<void> {
  try {
    if ('caches' in window) {
      await caches.delete(CACHE_NAME);
    }
  } catch (error) {
    console.error('Failed to clear blob cache:', error);
  }
}

/**
 * Revoke blob URL to free memory
 */
export function revokeBlobUrl(blobUrl: string): void {
  try {
    if (blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.warn('Failed to revoke blob URL:', error);
  }
}
