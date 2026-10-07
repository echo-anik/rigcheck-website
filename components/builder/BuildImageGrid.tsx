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

import { Cpu, CircuitBoard, Gamepad2, MemoryStick, HardDrive, Zap, Box, Fan, Settings } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  cpu: <Cpu className="w-8 h-8 text-blue-500" />,
  motherboard: <CircuitBoard className="w-8 h-8 text-blue-500" />,
  gpu: <Gamepad2 className="w-8 h-8 text-blue-500" />,
  ram: <MemoryStick className="w-8 h-8 text-blue-500" />,
  storage: <HardDrive className="w-8 h-8 text-blue-500" />,
  psu: <Zap className="w-8 h-8 text-blue-500" />,
  case: <Box className="w-8 h-8 text-blue-500" />,
  cooler: <Fan className="w-8 h-8 text-blue-500" />,
};

export function BuildImageGrid({ components, className = '' }: BuildImageGridProps) {
  const validComponents = components.filter((c) => c !== null && c !== undefined);

  if (validComponents.length === 0) {
    return (
      <div className={`bg-muted/30 rounded-lg p-4 flex items-center justify-center min-h-[200px] border border-border/50 ${className}`}>
        <p className="text-muted-foreground text-center">No components selected</p>
      </div>
    );
  }

  // Arrange components in a horizontal carousel
  return (
    <div className={`relative group w-full ${className}`}>
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 [&::-webkit-scrollbar]:hidden" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {validComponents.map((comp, idx) => {
          const imageUrl = comp?.primary_image_url || comp?.image_urls?.[0];
          const categoryIcon = categoryIcons[comp?.category?.toLowerCase() || ''] || <Settings className="w-8 h-8 text-slate-400" />;

          return (
            <div
              key={idx}
              className="flex-shrink-0 w-[140px] sm:w-[160px] snap-center bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 relative group/card"
            >
              {imageUrl ? (
                <div className="relative aspect-square bg-card p-2">
                  <Image
                    src={imageUrl}
                    alt={comp?.name || 'Component'}
                    fill
                    className="object-contain p-3 group-hover/card:scale-110 transition-transform duration-500"
                    sizes="160px"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-muted/30 flex items-center justify-center group-hover/card:bg-muted/50 transition-colors">
                  <div className="opacity-70 drop-shadow-sm scale-[1.5]">{categoryIcon}</div>
                </div>
              )}
              <div className="p-3 bg-gradient-to-t from-muted/30 to-card border-t border-border/50">
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-sm">
                  {comp?.category || 'PART'}
                </span>
                <p className="text-xs font-semibold text-foreground line-clamp-2 mt-1.5 leading-tight" title={comp?.name}>
                  {comp?.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Scroll indicator gradients */}
      <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none rounded-r-lg z-10" />
      <div className="absolute top-0 left-0 bottom-2 w-8 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none rounded-l-lg z-10" />
    </div>
  );
}
