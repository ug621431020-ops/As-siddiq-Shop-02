export type RecordStatus = 'idle' | 'recording' | 'stopping' | 'uploading' | 'success' | 'error';

export type TimeFilter = 'today' | 'week' | 'month';

export interface PackerStaff {
  id: string;
  name: string;
  nickname: string;
  role: string;
  avatarColor: string;
  avatarUrl?: string;
}

export interface CourierInfo {
  id: string;
  name: string;
  nameTh: string;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
  iconText: string;
  logoUrl?: string;
}

export interface PackRecord {
  id: string;
  stationId: string;
  operatorId: string;
  operatorName: string;
  trackingNumber: string;
  courier: CourierInfo;
  timestamp: string; // ISO String
  durationSec: number;
  videoBlobUrl?: string;
  imageBlobUrl?: string;
  videoSize?: string;
  uploadStatus: 'success' | 'failed';
  uploadResponse?: string;
  apiEndpointUsed?: string;
}

export interface PackingStation {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface AppConfig {
  apiUrl: string;
  uploadFormat: 'multipart' | 'json_base64';
  autoResetSeconds: number;
  stationId: string;
  currentOperatorId: string;
  preferCodec: 'video/webm;codecs=vp9' | 'video/webm;codecs=vp8' | 'video/mp4';
  soundEnabled: boolean;
  watermarkEnabled: boolean;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}
