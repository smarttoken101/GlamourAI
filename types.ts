
export enum Tab {
  TRY_ON = 'TRY_ON',
  GALLERY = 'GALLERY',
  ASSISTANT = 'ASSISTANT',
}

export interface TranscriptEntry {
  source: 'user' | 'model';
  text: string;
}
