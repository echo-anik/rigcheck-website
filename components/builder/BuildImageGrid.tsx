'use client';

import Image from 'next/image';

interface BuildComponent {
  name: string;
  image_urls?: string[];
  primary_image_url?: string;
  category?: string;
}

interface BuildImageGridProps {
  components: (BuildComponent | null | undefined)[];
  className?: string;
}

const categoryIcons: Record<string, string> = {
  cpu: '🖥️',
  motherboard: '🔲',
  gpu: '🎮',
  ram: '💾',
  storage: '💿',
  psu: '⚡',
  case: '🖼️',
  cooler: '❄️',
};

export function BuildImageGrid({ components, className = '' }: BuildImageGridProps) {
  const validComponents = components.filter((c) => c !== null && c !== undefined);

  if (validComponents.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[200px] ${className}`}>
        <p className="text-gray-400 text-center">No components selected</p>
      </div>
    );
  }

  // Arrange components in a grid: 1-2 items per row for better visibility
  const gridCols = validComponents.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className={className}>
      <div className={`grid ${gridCols} gap-3`}>
        {validComponents.map((comp, idx) => {
          const imageUrl = comp?.primary_image_url || comp?.image_urls?.[0];
          const categoryIcon = categoryIcons[comp?.category?.toLowerCase() || ''] || '🔧';

          return (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {imageUrl ? (
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt={comp?.name || 'Component'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <span className="text-3xl">{categoryIcon}</span>
                </div>
              )}
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-900 line-clamp-2">{comp?.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
