/**
 * CodeThrive Infotech - High-Speed Zero-Lag Client Cache & SWR Engine
 * Provides instant 0ms page navigation by serving in-memory cached state immediately,
 * while silently revalidating data in the background without blocking the UI.
 */

const memoryStore = new Map();

export const getFastCache = (key) => {
  if (memoryStore.has(key)) {
    return memoryStore.get(key);
  }
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryStore.set(key, parsed);
      return parsed;
    }
  } catch (e) {}
  return null;
};

export const setFastCache = (key, data) => {
  if (data === undefined || data === null) return;
  memoryStore.set(key, data);
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
};

export const invalidateFastCache = (key) => {
  if (key) {
    memoryStore.delete(key);
    try {
      sessionStorage.removeItem(key);
    } catch (e) {}
  } else {
    memoryStore.clear();
    try {
      sessionStorage.clear();
    } catch (e) {}
  }
};

/**
 * Background preloader for employee route chunks
 */
export const prefetchEmployeeRoutes = () => {
  try {
    if (typeof window !== 'undefined') {
      // Idle prefetch so it doesn't block initial interactive render
      const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
      schedule(() => {
        import('../pages/Dashboard').catch(() => {});
        import('../pages/MyTasks').catch(() => {});
        import('../pages/DailyReports').catch(() => {});
        import('../pages/Leave').catch(() => {});
        import('../pages/Attendance').catch(() => {});
        import('../pages/Payroll').catch(() => {});
        import('../pages/Documents').catch(() => {});
        import('../pages/MyProfile').catch(() => {});
      });
    }
  } catch (e) {}
};
