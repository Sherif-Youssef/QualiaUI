import React, { useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { ActionStep } from "@/types";
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
  const [screenshotType, setScreenshotType] = React.useState<'before' | 'after'>('after');

  useEffect(() => {
    if (selectedStep?.screenshot_after) {
      setScreenshotType('after');
    } else if (selectedStep?.screenshot_before) {
      setScreenshotType('before');
    }
  }, [selectedStep?.id]);

  const currentDisplayScreenshot = React.useMemo(() => {
    if (screenshotType === 'before' && selectedStep?.screenshot_before) {
      return selectedStep.screenshot_before;
    }
    if (screenshotType === 'after' && selectedStep?.screenshot_after) {
      return selectedStep.screenshot_after;
    }
    return screenshot;
  }, [screenshotType, selectedStep, screenshot]);

  useEffect(() => {
    if (imageRef.current && currentDisplayScreenshot !== previousScreenshot.current) {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
      );
      previousScreenshot.current = currentDisplayScreenshot;
    }

    if (infoRef.current) {
      gsap.fromTo(
        infoRef.current,
        { x: 20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [currentDisplayScreenshot, selectedStep]);

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

          {selectedStep && (selectedStep.screenshot_before || selectedStep.screenshot_after) && (
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
              <button
                onClick={() => setScreenshotType('before')}
                disabled={!selectedStep.screenshot_before}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${screenshotType === 'before'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 disabled:opacity-30'
                  }`}
              >
                Before
              </button>
              <button
                onClick={() => setScreenshotType('after')}
                disabled={!selectedStep.screenshot_after}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${screenshotType === 'after'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 disabled:opacity-30'
                  }`}
              >
                After
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f8f9fb] p-6 flex justify-center items-start custom-scrollbar">
        <div
          className="transition-all duration-300 ease-out bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-none"
          style={{ width: `${zoomLevel}%`, minWidth: '320px' }}
        >
          <div className="relative bg-white min-h-[400px] flex items-center justify-center">
            {currentDisplayScreenshot ? (
              <img
                ref={imageRef}
                src={currentDisplayScreenshot}
                alt="Browser Screenshot"
                className="w-full h-auto block transition-opacity duration-300"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
                  <Camera className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                  Screenshots show up here
                </p>
              </div>
            )}
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
