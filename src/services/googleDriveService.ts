/**
 * Google Drive API Service
 * Handles uploading packing proof photos & videos to Google Drive,
 * managing folders, listing proof files, and deleting with user confirmation.
 */

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  trackingNumber?: string;
}

export interface DriveStorageQuota {
  limit?: number; // bytes
  usage?: number; // bytes
  usageInDrive?: number;
  usageInDriveTrash?: number;
  user?: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
}

const FOLDER_NAME = 'PackSpace_Proofs';

/**
 * Get Google Drive storage quota and user profile
 */
export async function getDriveStorageInfo(accessToken: string): Promise<DriveStorageQuota> {
  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Google Drive API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    limit: data.storageQuota?.limit ? Number(data.storageQuota.limit) : undefined,
    usage: data.storageQuota?.usage ? Number(data.storageQuota.usage) : undefined,
    usageInDrive: data.storageQuota?.usageInDrive ? Number(data.storageQuota.usageInDrive) : undefined,
    user: data.user,
  };
}

/**
 * Get or create the dedicated "PackSpace_Proofs" folder in Google Drive
 */
export async function getOrCreateProofsFolder(accessToken: string): Promise<string> {
  // 1. Search for existing folder
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // 2. Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'โฟลเดอร์จัดเก็บภาพถ่ายและวิดีโอหลักฐานการแพ็คสินค้าจาก PackSpace',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create PackSpace folder on Google Drive');
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Upload a Blob (image or video) directly to Google Drive using multipart upload
 */
export async function uploadProofToDrive(
  accessToken: string,
  blob: Blob,
  filename: string,
  folderId?: string,
  description?: string
): Promise<DriveFileInfo> {
  const metadata = {
    name: filename,
    description: description || `PackSpace Logistics Proof - ${filename}`,
    parents: folderId ? [folderId] : undefined,
  };

  const boundary = '-------PackSpaceBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Build multipart body
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `${delimiter}Content-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`;

  const blobArrayBuffer = await blob.arrayBuffer();

  const body = new Blob(
    [
      metadataPart,
      mediaHeader,
      new Uint8Array(blobArrayBuffer),
      closeDelimiter,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,thumbnailLink,webViewLink,webContentLink';
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive upload failed: ${response.status} - ${errorText}`);
  }

  const uploaded = await response.json();
  return uploaded;
}

/**
 * List proof files from Google Drive
 */
export async function listDriveProofFiles(
  accessToken: string,
  options?: { folderId?: string; search?: string }
): Promise<DriveFileInfo[]> {
  let query = 'trashed = false';
  if (options?.folderId) {
    query += ` and '${options.folderId}' in parents`;
  }
  if (options?.search && options.search.trim()) {
    const clean = options.search.trim().replace(/'/g, "\\'");
    query += ` and (name contains '${clean}' or fullText contains '${clean}')`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,size,createdTime,thumbnailLink,webViewLink,webContentLink)&orderBy=createdTime desc&pageSize=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list Google Drive files: ${res.status}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Delete a file from Google Drive.
 * WARNING: The caller MUST always show an explicit confirmation dialog to the user before calling this.
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete file from Google Drive: ${res.status}`);
  }
}
