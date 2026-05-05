import { Camera, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenshotViewerProps {
    screenshot: string | null;
    number: number;
    description?: string;
    zoomLevel?: number;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetZoom?: () => void;
}

export const ScreenshotViewer: React.FC<ScreenshotViewerProps> = ({
    screenshot,
    number,
    zoomLevel = 100,
    onZoomIn,
    onZoomOut,
    onResetZoom
}) => {
    return (
        <section className="flex-1 bg-[#F8FAFC] flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

            <div className="flex-1 relative flex items-start justify-center p-6 md:p-12 overflow-auto custom-scrollbar">
                {screenshot ? (
                    <div className="relative flex flex-col items-center transition-all duration-300 ease-out"
                         style={{ width: `${zoomLevel}%`, minWidth: '320px' }}>
                        <div
                            className="relative w-full rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden group"
                        >
                            <img
                                src={screenshot}
                                alt={`Step ${number}`}
                                className="w-full h-auto block select-none"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="w-24 h-24 mx-auto bg-white rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-center">
                            <Camera className="w-10 h-10 text-gray-200" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Ready for Capture</h3>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                Select an execution step or start a new run to view live browser frames here.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {screenshot && onZoomIn && onZoomOut && onResetZoom && (
                <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-md z-20">
                    <div className="flex items-center justify-center gap-3">
                        <Button
                            onClick={onZoomOut}
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 rounded-xl bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:text-primary transition-all active:scale-95 shadow-sm"
                            disabled={zoomLevel <= 50}
                        >
                            <ZoomOut className="w-5 h-5" />
                        </Button>

                        <Button
                            onClick={onResetZoom}
                            variant="outline"
                            className="px-6 h-10 rounded-xl bg-white border-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 hover:text-primary transition-all active:scale-95 shadow-sm flex items-center gap-2"
                        >
                            <Maximize className="w-3 h-3" />
                            {zoomLevel}% Reset
                        </Button>

                        <Button
                            onClick={onZoomIn}
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 rounded-xl bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:text-primary transition-all active:scale-95 shadow-sm"
                            disabled={zoomLevel >= 200}
                        >
                            <ZoomIn className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
};
