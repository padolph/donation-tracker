// Shared by the photo picker and the savePhoto server action.
// Kept out of photoActions.ts because 'use server' files may only export async functions.
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, matches serverActions.bodySizeLimit
