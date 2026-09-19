export interface AudioRecord {
  readonly id: string;
  songId: string;
  name: string;
  blob: Blob;
  mimeType: string;
  duration: number;
  createdAt: number;
}
