import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TRACCAR_URL = process.env.TRACCAR_URL || 'http://localhost:8082';
const TRACCAR_EMAIL = process.env.TRACCAR_EMAIL || 'manikandanbca2021@gmail.com';
const TRACCAR_PASSWORD = process.env.TRACCAR_PASSWORD || 'Mani2428Mk@#';

const traccarApi = axios.create({
  baseURL: TRACCAR_URL,
  auth: {
    username: TRACCAR_EMAIL,
    password: TRACCAR_PASSWORD,
  },
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * Get the latest position for a device by its ID or Unique Identifier (IMEI)
 * @param {string|number} deviceId - The internal Traccar device ID or Unique Identifier
 * @returns {Promise<Object|null>} - The position object
 */
export const getDevicePosition = async (deviceId) => {
  try {
    // Traccar positions API can filter by deviceId
    // If deviceId is the unique identifier (IMEI), we might need to find the internal ID first
    // But usually, users might pass the internal ID if they have it.
    
    // Attempt to fetch by deviceId (internal ID)
    const response = await traccarApi.get('/api/positions', {
      params: { deviceId }
    });

    if (response.data && response.data.length > 0) {
      // Positions are usually returned in reverse chronological order or we take the first one
      return response.data[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching position from Traccar:', error.message);
    throw error;
  }
};

/**
 * Find device internal ID by unique identifier (IMEI)
 * @param {string} uniqueId 
 */
export const findDeviceByUniqueId = async (uniqueId) => {
  try {
    const response = await traccarApi.get('/api/devices', {
      params: { uniqueId }
    });

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error finding device in Traccar:', error.message);
    throw error;
  }
};

export default {
  getDevicePosition,
  findDeviceByUniqueId,
  traccarApi,
};
