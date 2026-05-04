import React, { useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/button';
import { ActionStep } from '@/types/test-case';
import gsap from 'gsap';

interface ScreenshotViewerProps {
  screenshot: string;
  url: string;
  selectedStep: ActionStep | null;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const ScreenshotViewer: React.FC<ScreenshotViewerProps> = ({
  screenshot,
  url,
  selectedStep,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const previousScreenshot = useRef<string>(screenshot);

  useEffect(() => {
    if (imageRef.current && screenshot !== previousScreenshot.current) {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
      );
      previousScreenshot.current = screenshot;
    }

    if (infoRef.current) {
      gsap.fromTo(
        infoRef.current,
        { x: 20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [screenshot, selectedStep]);

  return (
    <section
      id="screenshot-viewer"
      className="flex-1 bg-background flex flex-col overflow-hidden"
    >
      <div className="h-[100px] px-8 flex flex-col justify-center border-b border-border bg-white z-20">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3 bg-muted/50 rounded-2xl px-5 py-3 border border-border/50">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">
              Active URL
            </span>
            <span className="text-sm font-mono font-bold text-primary flex-1 truncate">
              {url || 'Waiting for browser session...'}
            </span>
          </div>

        </div>
      </div>

      <div className="flex-1 overflow-hidden flex bg-[#f8f9fb] relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="flex-1 overflow-hidden bg-transparent relative flex items-center justify-center p-6">
          <div className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-300 ease-out origin-center" style={{ transform: `scale(${zoomLevel / 100})` }}>
            <img
              ref={imageRef}
              src={screenshot || 'https://placehold.co/1280x720/e2e8f0/64748b?text=Waiting+for+Automation+Run...'}
              alt="Browser Screenshot"
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/50 backdrop-blur-sm bg-white"
              loading="lazy"
            />
          </div>
        </div>

      </div>

      <div className="p-6 border-t border-border bg-white z-20">
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={onZoomOut}
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-xl bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:text-primary transition-all active:scale-95"
            disabled={zoomLevel <= 50}
          >
            <ZoomOut className="w-5 h-5" />
          </Button>

          <Button
            onClick={onResetZoom}
            variant="outline"
            className="px-6 h-10 rounded-xl bg-white border-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 hover:text-primary transition-all active:scale-95"
          >
            {zoomLevel}% Reset
          </Button>

          <Button
            onClick={onZoomIn}
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-xl bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:text-primary transition-all active:scale-95"
            disabled={zoomLevel >= 200}
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
