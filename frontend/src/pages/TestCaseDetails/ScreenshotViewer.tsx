import React from 'react';
import { Camera, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenshotViewerProps {
    screenshot: string | null;
    number: number;
    zoomLevel: number;
    setZoomLevel: (level: number) => void;
}

export const ScreenshotViewer: React.FC<ScreenshotViewerProps> = ({
    screenshot,
    number,
    zoomLevel,
    setZoomLevel
}) => {
    return (
        <section className="flex-1 bg-[#1a1c1e] flex flex-col items-stretch overflow-hidden">
            <div className="flex-1 overflow-auto p-8 md:p-12 flex items-center justify-center custom-scrollbar">
                {screenshot ? (
                    <div className="relative group perspective-1000">
                        <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <img
                            src={screenshot}
                            alt={`Step ${number}`}
                            className="max-w-[85vw] max-h-[70vh] rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 relative z-10"
                            style={{
                                transform: `scale(${zoomLevel / 100})`,
                                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        />
                        <div className="absolute bottom-6 left-6 z-20 bg-black/60 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-xl">
                            <p className="text-white text-xs font-black uppercase tracking-widest">
                                Step <span className="text-primary">{number}</span> Frame
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 mx-auto bg-white/5 rounded-[40px] flex items-center justify-center border border-white/10">
                            <Camera className="w-10 h-10 text-white/20" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No Capture Available</p>
                            <p className="text-white/20 text-xs font-medium">Select a step or run the test to see screenshots</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 md:p-6 bg-black/40 backdrop-blur-2xl border-t border-white/10 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <Button
                        onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                        variant="ghost"
                        size="icon"
                        disabled={zoomLevel <= 50 || !screenshot}
                        className="w-10 h-10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </Button>
                    <Button
                        onClick={() => setZoomLevel(100)}
                        variant="ghost"
                        size="icon"
                        disabled={!screenshot}
                        className="w-10 h-10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                    <Button
                        onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                        variant="ghost"
                        size="icon"
                        disabled={zoomLevel >= 200 || !screenshot}
                        className="w-10 h-10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </Button>
                    <div className="px-4 border-l border-white/10 ml-1">
                        <span className="text-xs font-black text-white/80 w-12 text-center inline-block">{zoomLevel}%</span>
                    </div>
                </div>
            </div>
        </section>
    );
};
