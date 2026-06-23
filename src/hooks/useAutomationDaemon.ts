import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { automationService } from '../services/automationService';

/**
 * Background Daemon that runs Auto-Pilot routines silently
 * while the business owner is using the application.
 */
export function useAutomationDaemon(intervalMinutes = 60) {
  const { profile, user, business } = useAuth();
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
        
        // Fetch config dynamically from business settings
        const bizSettings = business?.settings || {};
        const config = {
          autoDunning: bizSettings.dunning_daemon ?? true,
          dunningDaysBefore: bizSettings.dunning_days_before ?? 3,
          dunningDaysAfter: bizSettings.dunning_days_after ?? 5,
          autoLateFee: bizSettings.auto_late_fee ?? true,
          lateFeePercent: bizSettings.late_fee_percent ?? 2,
          autoRestock: bizSettings.auto_restock ?? true,
          restockThreshold: bizSettings.restock_threshold ?? 10,
          dailyBriefing: bizSettings.daily_briefing ?? false
        };
        
        await automationService.runAutoPilot(
          profile?.business_id!, 
          user?.id!, 
          user?.email || 'system', 
          config
        );
      } catch (e) {
        console.error("[Daemon] Execution failed:", e);
      } finally {
        isRunning.current = false;
      }
    }
  }, [profile?.business_id, user, business, intervalMinutes]);
}
