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
        <section className="flex-1 bg-[#F8FAFC] flex flex-col overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

            <div className="flex-1 relative flex items-center justify-center p-6 md:p-12 overflow-hidden">
                {screenshot ? (
                    <div className="relative w-full h-full flex items-center justify-center group">
                        {/* Image Shadow/Glow */}
                        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="relative max-w-full max-h-full flex items-center justify-center rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
                            <img
                                src={screenshot}
                                alt={`Step ${number}`}
                                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl select-none"
                            />
                        </div>

                        {/* Step Info Overlay */}
                        <div className="absolute bottom-8 left-8 z-20 bg-white/90 backdrop-blur-xl border border-gray-100 px-5 py-3 rounded-2xl shadow-xl transform transition-transform group-hover:-translate-y-1">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-black">
                                    {number}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-gray-900 text-[10px] font-black uppercase tracking-widest">
                                        Frame Capture
                                    </p>
                                    {description && (
                                        <p className="text-gray-500 text-[10px] font-medium max-w-[200px] truncate">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            </div>
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
        </section>
    );
};
