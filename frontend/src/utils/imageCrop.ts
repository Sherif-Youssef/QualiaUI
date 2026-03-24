export const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<File> => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx?.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                return reject(new Error('Canvas is empty'));
            }
            const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
            resolve(file);
        }, 'image/jpeg');
    });
}   