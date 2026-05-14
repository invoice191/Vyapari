import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { automationService } from '../services/automationService';

/**
 * Background Daemon that runs Auto-Pilot routines silently
 * while the business owner is using the application.
 */
export function useAutomationDaemon(intervalMinutes = 60) {
  const { profile, user } = useAuth();
  const isRunning = useRef(false);

  useEffect(() => {
    if (!profile?.business_id || !user) return;

    // Run once on startup (with a slight delay to let the app load)
    const initialRun = setTimeout(async () => {
      await executeDaemon();
    }, 10000);

    // Run periodically
    const interval = setInterval(async () => {
      await executeDaemon();
    }, intervalMinutes * 60 * 1000);

    return () => {
      clearTimeout(initialRun);
      clearInterval(interval);
    };

    async function executeDaemon() {
      if (isRunning.current) return;
      isRunning.current = true;
      try {
        console.log("[Daemon] Running background automation check...");
        // Fetch config from somewhere or use defaults
        const defaultConfig = {
          autoDunning: true,
          dunningDaysBefore: 3,
          dunningDaysAfter: 5,
          autoLateFee: true,
          lateFeePercent: 2,
          autoRestock: true,
          restockThreshold: 10,
          dailyBriefing: false
        };
        
        await automationService.runAutoPilot(
          profile?.business_id!, 
          user?.id!, 
          user?.email || 'system', 
          defaultConfig
        );
      } catch (e) {
        console.error("[Daemon] Execution failed:", e);
      } finally {
        isRunning.current = false;
      }
    }
  }, [profile?.business_id, user, intervalMinutes]);
}
