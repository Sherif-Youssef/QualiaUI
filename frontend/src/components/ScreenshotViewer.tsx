import React, { useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Activity, AlertCircle, CheckCircle2, Info } from 'lucide-react';
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

          {selectedStep && (
            <div className={`px-4 py-3 rounded-2xl border flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 ${selectedStep.status === 'success'
                ? 'bg-success/5 text-success border-success/10'
                : 'bg-failure/5 text-failure border-failure/10'
              }`}>
              {selectedStep.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-xs font-black uppercase tracking-widest">{selectedStep.status || 'Executed'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex bg-[#f8f9fb] relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="flex-1 overflow-auto bg-transparent relative custom-scrollbar">
          <div className="min-w-full min-h-full flex items-center justify-center p-20 md:p-40">
            <div className="relative z-10 transition-transform duration-300 ease-out origin-center" style={{ transform: `scale(${zoomLevel / 100})` }}>
              <img
                ref={imageRef}
                src={screenshot || 'https://placehold.co/1280x720/e2e8f0/64748b?text=Waiting+for+Automation+Run...'}
                alt="Browser Screenshot"
                className="max-w-full h-auto rounded-[2rem] shadow-2xl border border-white/50 backdrop-blur-sm bg-white"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Professional Info Panel */}
        {selectedStep && (
          <div
            ref={infoRef}
            className="w-[320px] border-l border-border bg-white/80 backdrop-blur-md p-6 flex flex-col gap-6 overflow-y-auto z-10"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Activity className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Step Execution Result</h4>
              </div>

              <div className="p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-inner">
                <p className="text-sm font-bold text-gray-900 leading-relaxed italic">
                  "{selectedStep.text}"
                </p>
              </div>
            </div>

            {selectedStep.description && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-failure">
                  <Info className="w-4 h-4" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Error Details</h4>
                </div>

                <div className="p-5 bg-red-50/50 rounded-[1.5rem] border border-red-100/50">
                  <p className="text-xs font-semibold text-red-600 leading-relaxed">
                    {selectedStep.description}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
                Step {selectedStep.number} of History Run
              </p>
            </div>
          </div>
        )}
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
