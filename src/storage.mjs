import fs from 'node:fs';
import path from 'node:path';
import { env } from './env.mjs';

const storageDir = path.join(env.ROOT_DIR, 'storage');
const briefingsDir = path.join(storageDir, 'briefings');
const rawDir = path.join(storageDir, 'raw');
const devicesFile = path.join(storageDir, 'devices.json');

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

export function ensureStorage() {
  ensureDir(storageDir);
  ensureDir(briefingsDir);
  ensureDir(rawDir);
  if (!fs.existsSync(devicesFile)) {
    fs.writeFileSync(devicesFile, '[]\n', 'utf8');
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function briefingPath(date) {
  return path.join(briefingsDir, `${date}.json`);
}

export function getBriefing(date) {
  return readJson(briefingPath(date), null);
}

export function saveBriefing(briefing) {
  writeJson(briefingPath(briefing.date), briefing);
  return briefing;
}

export function listBriefings() {
  ensureStorage();
  return fs
    .readdirSync(briefingsDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(briefingsDir, name), null))
    .filter(Boolean)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function getLatestBriefing() {
  return listBriefings()[0] ?? null;
}

export function saveRawIngest(date, payload) {
  writeJson(path.join(rawDir, `${date}.json`), payload);
}

export function listDevices() {
  ensureStorage();
  return readJson(devicesFile, []);
}

export function upsertDevice(device) {
  const devices = listDevices();
  const existingIndex = devices.findIndex((item) => item.token === device.token);
  const nextDevice = {
    nickname: '',
    platform: 'huawei',
    enabled: true,
    ...device,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    devices[existingIndex] = { ...devices[existingIndex], ...nextDevice };
  } else {
    devices.push(nextDevice);
  }

  writeJson(devicesFile, devices);
  return nextDevice;
}
