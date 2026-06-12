/**
 * Firebase client initialization and helper functions
 * للاتصال بقاعدة بيانات Firebase من Frontend
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, get, update, remove, query, orderByChild, limitToLast } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured() {
  return !!(
    process.env.REACT_APP_FIREBASE_API_KEY &&
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN &&
    process.env.REACT_APP_FIREBASE_PROJECT_ID &&
    process.env.REACT_APP_FIREBASE_DATABASE_URL
  );
}

/**
 * Create a new session in Firebase
 * @param {object} payload - {name, student_name, components, wires}
 * @returns {Promise<object>} Created session
 */
export async function fbCreate(payload) {
  const now = new Date().toISOString();
  const sessionId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  
  const sessionData = {
    id: sessionId,
    name: payload.name || 'جلسة بدون اسم',
    student_name: payload.student_name || '',
    components: payload.components || [],
    wires: payload.wires || [],
    created_at: now,
    updated_at: now,
  };

  try {
    const sessionRef = ref(database, `lab_sessions/${sessionId}`);
    await update(sessionRef, sessionData);
    return sessionData;
  } catch (error) {
    console.error('Firebase create error:', error);
    throw error;
  }
}

/**
 * Get a single session from Firebase
 * @param {string} id - Session ID
 * @returns {Promise<object>} Session data
 */
export async function fbGet(id) {
  try {
    const sessionRef = ref(database, `lab_sessions/${id}`);
    const snapshot = await get(sessionRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    throw new Error('Session not found');
  } catch (error) {
    console.error('Firebase get error:', error);
    throw error;
  }
}

/**
 * List all sessions from Firebase
 * @param {number} limit - Maximum number of sessions to return
 * @returns {Promise<array>} List of sessions
 */
export async function fbList(limit = 500) {
  try {
    const sessionsRef = ref(database, 'lab_sessions');
    const q = query(sessionsRef, orderByChild('updated_at'), limitToLast(limit));
    const snapshot = await get(q);
    
    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    const sessions = [];

    // Convert Firebase object to array and reverse (newest first)
    Object.values(data).reverse().forEach((session) => {
      sessions.push({
        id: session.id,
        name: session.name || '',
        student_name: session.student_name || '',
        updated_at: session.updated_at || '',
        created_at: session.created_at || '',
        component_count: Array.isArray(session.components) ? session.components.length : 0,
        wire_count: Array.isArray(session.wires) ? session.wires.length : 0,
        components: session.components || [],
        wires: session.wires || [],
      });
    });

    return sessions.slice(0, limit);
  } catch (error) {
    console.error('Firebase list error:', error);
    throw error;
  }
}

/**
 * Update a session in Firebase
 * @param {string} id - Session ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated session
 */
export async function fbUpdate(id, updates) {
  try {
    const now = new Date().toISOString();
    const updateData = {
      ...updates,
      updated_at: now,
    };

    const sessionRef = ref(database, `lab_sessions/${id}`);
    
    // First get current session
    const snapshot = await get(sessionRef);
    if (!snapshot.exists()) {
      throw new Error('Session not found');
    }

    const current = snapshot.val();
    const merged = { ...current, ...updateData };
    
    await update(sessionRef, merged);
    return merged;
  } catch (error) {
    console.error('Firebase update error:', error);
    throw error;
  }
}

/**
 * Delete a session from Firebase
 * @param {string} id - Session ID
 * @returns {Promise<void>}
 */
export async function fbDelete(id) {
  try {
    const sessionRef = ref(database, `lab_sessions/${id}`);
    await remove(sessionRef);
  } catch (error) {
    console.error('Firebase delete error:', error);
    throw error;
  }
}
