import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const settingsFilePath = path.join(process.cwd(), 'settings.json');

const defaultSettings = {
  appName: 'XTOWN School Tracker',
  contactEmail: 'support@xtown.com',
  maintenanceMode: false,
  autoBackup: true,
  notificationEmails: true,
  smsAlerts: false,
  theme: 'Enterprise Dark',
  apiKey: 'xt_live_4492_fa19_8e21_c154'
};

const readSettings = () => {
  try {
    if (!fs.existsSync(settingsFilePath)) {
      fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const data = fs.readFileSync(settingsFilePath, 'utf8');
    return { ...defaultSettings, ...JSON.parse(data) };
  } catch (error) {
    console.error('[Settings] Error reading settings:', error);
    return defaultSettings;
  }
};

const writeSettings = (settings) => {
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('[Settings] Error writing settings:', error);
  }
};

// Get settings
router.get('/', (req, res) => {
  const settings = readSettings();
  res.status(200).json({ status: 'success', data: settings });
});

// Update settings
router.patch('/', (req, res) => {
  const currentSettings = readSettings();
  const newSettings = { ...currentSettings, ...req.body };
  writeSettings(newSettings);
  res.status(200).json({ status: 'success', data: newSettings });
});

export default router;
