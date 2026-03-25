import React, { useState, useEffect } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { X } from 'lucide-react';
import { getCroppedImg } from '@/utils/imageCrop';

interface Props {
    image: string;
    onCropComplete: (file: File) => void;
    onClose: () => void;
    aspect: number;
    cropShape?: 'rect' | 'round';
}

export const ImageCropModal: React.FC<Props> = ({ image, onCropComplete, onClose, aspect, cropShape = 'rect' }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        try {
            const croppedFile = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedFile);
        } catch (error) {
            console.error("Failed to crop image:", error);
        }
    }
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-2xl rounded-[2rem] shadow-2xl border border-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                    <h3 className="font-bold text-lg text-foreground">
                        Adjust {cropShape === 'round' ? 'Avatar' : 'Banner'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="relative h-[400px] w-full bg-black/10">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropShape={cropShape}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                        classes={{
                            containerClassName: "bg-black/50",
                            mediaClassName: "opacity-80 transition-opacity",
                            cropAreaClassName: "border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                        }}
                    />
                </div>
                <div className="p-6 bg-card border-t border-border flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground min-w-[50px]">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 accent-primary h-1.5 bg-muted rounded-full appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-8 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
