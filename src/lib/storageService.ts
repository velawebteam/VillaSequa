/**
 * Compresses an image file and returns a Base64 string.
 * We use aggressive compression to ensure it fits in Firestore (1MB limit).
 */
const compressToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // More aggressive max dimensions for Firestore (approx 60-100KB per image)
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Lower quality (0.5) to keep Base64 strings smaller
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file for compression'));
    reader.readAsDataURL(file);
  });
};

/**
 * Acts as a wrapper for image processing.
 * Returns a Base64 string to be stored in Firestore.
 */
export const uploadImage = async (file: File, _path: string): Promise<string> => {
  try {
    console.log(`Processing image: ${file.name}`);
    const dataUrl = await compressToDataUrl(file);
    console.log(`Finished processing: ${file.name} (Base64 length: ${dataUrl.length})`);
    return dataUrl;
  } catch (error) {
    console.error('Error processing image:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred during image processing.');
  }
};
