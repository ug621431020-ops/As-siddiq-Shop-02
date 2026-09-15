import { PackRecord } from '../types';
import { detectCourier } from './courierDetector';
import { DEFAULT_PACKERS } from './staffData';

// Generates initial realistic pack records across Today, This Week, and This Month
export function getInitialPackRecords(): PackRecord[] {
  const now = new Date();
  const records: PackRecord[] = [];

  const sampleTrackings = [
    { code: 'TH02918471920A', dur: 14, staffIdx: 0, station: 'STATION-01' },
    { code: '820492817264', dur: 18, staffIdx: 1, station: 'STATION-02' },
    { code: 'KERTH92817492', dur: 22, staffIdx: 2, station: 'STATION-03' },
    { code: 'SPXTH827163910', dur: 16, staffIdx: 0, station: 'STATION-01' },
    { code: 'ED829103948TH', dur: 19, staffIdx: 3, station: 'STATION-04' },
    { code: 'TH01928472911B', dur: 12, staffIdx: 4, station: 'STATION-01' },
    { code: '820381927492', dur: 25, staffIdx: 1, station: 'STATION-02' },
    { code: 'TT892817492TH', dur: 15, staffIdx: 2, station: 'STATION-03' },
    { code: 'SPXTH728192048', dur: 20, staffIdx: 0, station: 'STATION-01' },
    { code: 'KERTH82910482', dur: 17, staffIdx: 3, station: 'STATION-04' },
  ];

  // 1. Records for Today (last few hours)
  sampleTrackings.forEach((item, idx) => {
    const timestamp = new Date(now.getTime() - (idx * 28 + 10) * 60 * 1000).toISOString();
    const courier = detectCourier(item.code);
    const staff = DEFAULT_PACKERS[item.staffIdx % DEFAULT_PACKERS.length];
    records.push({
      id: `PK-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${idx + 101}`,
      stationId: item.station,
      operatorId: staff.id,
      operatorName: `${staff.name} (${staff.nickname})`,
      trackingNumber: item.code,
      courier,
      timestamp,
      durationSec: item.dur,
      uploadStatus: 'success',
      uploadResponse: 'OK - 200',
      apiEndpointUsed: '/api/upload',
    });
  });

  // 2. Records for Past 6 Days (This Week)
  const weekTrackings = [
    { code: 'TH03918471999A', dur: 16, staffIdx: 1, daysAgo: 1 },
    { code: '820491827491', dur: 21, staffIdx: 2, daysAgo: 1 },
    { code: 'SPXTH918274920', dur: 13, staffIdx: 0, daysAgo: 2 },
    { code: 'KERTH72819203', dur: 24, staffIdx: 3, daysAgo: 2 },
    { code: 'ED719284920TH', dur: 18, staffIdx: 4, daysAgo: 3 },
    { code: 'TH04918274928C', dur: 15, staffIdx: 0, daysAgo: 3 },
    { code: '820591827394', dur: 17, staffIdx: 1, daysAgo: 4 },
    { code: 'TT728192048TH', dur: 19, staffIdx: 2, daysAgo: 4 },
    { code: 'SPXTH628192039', dur: 22, staffIdx: 3, daysAgo: 5 },
    { code: 'KERTH62819204', dur: 14, staffIdx: 0, daysAgo: 5 },
    { code: 'TH05918274920D', dur: 16, staffIdx: 4, daysAgo: 6 },
    { code: '820691827492', dur: 20, staffIdx: 1, daysAgo: 6 },
  ];

  weekTrackings.forEach((item, idx) => {
    const timestamp = new Date(now.getTime() - (item.daysAgo * 24 * 60 * 60 * 1000) - (idx * 45 * 60 * 1000)).toISOString();
    const courier = detectCourier(item.code);
    const staff = DEFAULT_PACKERS[item.staffIdx % DEFAULT_PACKERS.length];
    records.push({
      id: `PK-W${idx + 201}`,
      stationId: `STATION-0${(idx % 4) + 1}`,
      operatorId: staff.id,
      operatorName: `${staff.name} (${staff.nickname})`,
      trackingNumber: item.code,
      courier,
      timestamp,
      durationSec: item.dur,
      uploadStatus: 'success',
      uploadResponse: 'OK - 200',
      apiEndpointUsed: '/api/upload',
    });
  });

  // 3. Records for Past 7-25 Days (Earlier this month)
  const monthTrackings = [
    { code: 'TH06918274921E', dur: 15, staffIdx: 0, daysAgo: 8 },
    { code: '820791827493', dur: 18, staffIdx: 1, daysAgo: 10 },
    { code: 'SPXTH528192038', dur: 14, staffIdx: 2, daysAgo: 12 },
    { code: 'KERTH52819205', dur: 22, staffIdx: 3, daysAgo: 14 },
    { code: 'ED619284921TH', dur: 19, staffIdx: 4, daysAgo: 16 },
    { code: 'TH07918274922F', dur: 17, staffIdx: 0, daysAgo: 18 },
    { code: '820891827494', dur: 23, staffIdx: 1, daysAgo: 20 },
    { code: 'SPXTH428192037', dur: 16, staffIdx: 2, daysAgo: 22 },
  ];

  monthTrackings.forEach((item, idx) => {
    const timestamp = new Date(now.getTime() - (item.daysAgo * 24 * 60 * 60 * 1000) - (idx * 60 * 60 * 1000)).toISOString();
    const courier = detectCourier(item.code);
    const staff = DEFAULT_PACKERS[item.staffIdx % DEFAULT_PACKERS.length];
    records.push({
      id: `PK-M${idx + 301}`,
      stationId: `STATION-0${(idx % 4) + 1}`,
      operatorId: staff.id,
      operatorName: `${staff.name} (${staff.nickname})`,
      trackingNumber: item.code,
      courier,
      timestamp,
      durationSec: item.dur,
      uploadStatus: 'success',
      uploadResponse: 'OK - 200',
      apiEndpointUsed: '/api/upload',
    });
  });

  return records;
}
