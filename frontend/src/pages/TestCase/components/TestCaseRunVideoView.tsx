import React from 'react';
import { Video, Info } from 'lucide-react';

interface TestCaseRunVideoViewProps {
    videoUrl?: string | null;
    status?: string;
}

export const TestCaseRunVideoView: React.FC<TestCaseRunVideoViewProps> = ({
    videoUrl,
    status
}) => {
    const isRunning = status?.toUpperCase() === 'RUNNING' || status?.toUpperCase() === 'QUEUED';

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 min-h-0">
            {videoUrl ? (
                <div className="w-full max-w-4xl bg-black rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-full">
                    <video 
                        src={videoUrl} 
                        controls={true} 
                        className="w-full h-auto max-h-[60vh] object-contain"
                        autoPlay={true}
                        muted={true}
                        playsInline={true}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center text-center max-w-md space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                        {isRunning ? (
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        ) : (
                            <Video className="w-10 h-10 text-gray-300" />
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900">
                            {isRunning ? 'Video Recording in Progress' : 'No Video Available'}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {isRunning 
                                ? 'The video for this run is currently being recorded and will be available once the run is complete.' 
                                : 'No video was recorded for this run or the video is still being processed.'}
                        </p>
                    </div>

                    {!isRunning && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium border border-blue-100">
                            <Info className="w-4 h-4" />
                            Ensure "Record Video" was enabled during configuration.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
