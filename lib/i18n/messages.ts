export type Locale = 'en' | 'zh'

export const messages = {
  en: {
    common: {
      unauthorized: 'Unauthorized. Please sign in.',
      unknownError: 'Unknown error',
    },
    upload: {
      success: 'Image uploaded successfully.',
      failed: 'Upload failed.',
      missingFile: 'No file provided.',
      unsupportedType: 'Unsupported file type. Only images are allowed (JPG, JPEG, PNG, WEBP).',
      tooLarge: 'File is too large. Maximum size is 10MB.',
      storageNotConfigured: 'Storage is not configured (R2 credentials missing).',
    },
    batch: {
      insufficientCredits: 'Insufficient credits.',
      created: (n: number) => `Batch created. Total: ${n} videos.`,
    },
    download: {
      planNoDownload:
        'Your current plan does not support direct downloads. Please upgrade to unlock downloads.',
      videoLimit:
        'This video has reached its download limit for today. Try again tomorrow or upgrade your plan.',
      userLimit:
        'You have reached your total download limit for today. Try again tomorrow or upgrade your plan.',
    },
    wallet: {
      userNotFound: 'User not found.',
      fetchFailed: 'Failed to fetch wallet.',
    },
    useCases: {
      timeout: 'Query timed out (20s).',
      timeoutOrFailed: 'Query timed out or failed.',
    },
    prompts: {
      chinese: 'Chinese',
      english: 'English',
    },
  },
  // Placeholder only. We intentionally do not enable zh in non-admin flows yet.
  zh: {},
} as const

