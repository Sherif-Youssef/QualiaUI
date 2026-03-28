import React, { useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import gsap from 'gsap';

interface ScreenshotViewerProps {
  screenshot: string;
  url: string;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const ScreenshotViewer: React.FC<ScreenshotViewerProps> = ({
  screenshot,
  url,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const previousScreenshot = useRef<string>(screenshot);

  useEffect(() => {
    if (imageRef.current && screenshot !== previousScreenshot.current) {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
      previousScreenshot.current = screenshot;
    }
  }, [screenshot]);

  return (
    <section
      id="screenshot-viewer"
      className="flex-1 bg-background flex flex-col"
    >
      <div className="h-[100px] px-8 flex flex-col justify-center border-b border-border bg-white translate-y-[-1px]">
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 border border-border/50">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Active URL
          </span>
          <span className="text-sm font-mono text-primary flex-1 truncate">
            {url || 'Waiting for browser session...'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[#f0f2f5] relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="relative z-10">
          <img
            ref={imageRef}
            src={screenshot || 'https://placehold.co/1280x720/e2e8f0/64748b?text=Waiting+for+Automation+Run...'}
            alt="Browser Screenshot"
            className="max-w-[95%] h-auto rounded-xl shadow-2xl border border-white/50 backdrop-blur-sm"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            loading="lazy"
          />
        </div>
      </div>
      
      <div className="p-6 border-t border-border bg-card">
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={onZoomOut}
            variant="outline"
            size="icon"
            className="bg-transparent text-foreground border-border hover:bg-muted hover:text-foreground"
            aria-label="Zoom out"
            disabled={zoomLevel <= 50}
          >
            <ZoomOut className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          
          <Button
            onClick={onResetZoom}
            variant="outline"
            size="icon"
            className="bg-transparent text-foreground border-border hover:bg-muted hover:text-foreground"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          
          <Button
            onClick={onZoomIn}
            variant="outline"
            size="icon"
            className="bg-transparent text-foreground border-border hover:bg-muted hover:text-foreground"
            aria-label="Zoom in"
            disabled={zoomLevel >= 200}
          >
            <ZoomIn className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          
          <span className="ml-4 text-body-md font-body text-muted-foreground">
            {zoomLevel}%
          </span>
        </div>
      </div>
    </section>
  );
};
