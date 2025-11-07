export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export interface ImagePromptRequest {
  base64Image: string;
  mimeType: string;
  prompt: string;
}

export enum FileSize {
  MAX_UPLOAD_MB = 10,
  MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024,
}

// Augment the MediaTrackConstraintSet interface to include the 'torch' property
// This is necessary because 'torch' is an experimental/advanced constraint
// and might not be present in the default TypeScript DOM library definitions.
declare global {
  interface MediaTrackConstraintSet {
    torch?: ConstrainBoolean;
  }
}