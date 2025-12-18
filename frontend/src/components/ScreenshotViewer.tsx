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
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-3">
          <span className="text-body-md font-body text-muted-foreground">
            URL:
          </span>
          <span className="text-body-md font-body text-foreground flex-1 truncate">
            {url}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-gray-100">
        <div className="relative">
          <img
            ref={imageRef}
            src={screenshot}
            alt="screenshot placeholder"
            className="max-w-full h-auto rounded-lg shadow-md border border-border"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center',
              transition: 'transform 0.3s ease-in-out',
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
