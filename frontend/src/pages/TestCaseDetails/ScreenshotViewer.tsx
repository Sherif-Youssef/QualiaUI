import { Camera } from 'lucide-react';

interface ScreenshotViewerProps {
    screenshot: string | null;
    number: number;
    description?: string;
}

export const ScreenshotViewer: React.FC<ScreenshotViewerProps> = ({
    screenshot,
    number,
    description,
}) => {
    return (
        <section className="flex-1 bg-slate-50 flex flex-col items-stretch overflow-hidden">
            <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
                <div className="min-w-full min-h-full flex items-center justify-center p-4 md:p-8">
                    {screenshot ? (
                        <div className="relative group perspective-1000 origin-center transition-transform duration-300 ease-out">
                            <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <img
                                src={screenshot}
                                alt={`Step ${number}`}
                                className="max-w-[95%] max-h-[85vh] rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-200 relative z-10 bg-white"
                            />
                            <div className="absolute bottom-6 left-6 z-20 bg-white/80 backdrop-blur-xl border border-gray-200 px-4 py-2 rounded-xl shadow-lg">
                                <p className="text-gray-900 text-xs font-black uppercase tracking-widest">
                                    Step <span className="text-primary">{number}</span> Frame
                                </p>
                                {description && (
                                    <p className="text-gray-600 text-xs mt-1 max-w-sm break-words font-medium">
                                        {description}
                                    </p>
                                )}
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
            </div>
        </section>
    );
};
