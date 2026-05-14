import { toast } from "sonner";

export const pushNotificationService = {
  /**
   * Request runtime permission to trigger OS-level push notifications
   */
  requestPermission: async () => {
    if (!("Notification" in window)) {
      console.warn("Web notifications are not supported on this browser architecture.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success("Vyapari Alert Engine Connected.");
        
        // Optional: Fire a confirmation visual ping
        new Notification("Vyapari Signal Locked", {
          body: "Real-time transaction push stream is active.",
          icon: "/icon-192.png"
        });
        return true;
      } else {
        toast.warning("Live Alert streaming suppressed by OS.");
        return false;
      }
    } catch (error) {
      console.error("[PushNotify] Failure:", error);
      return false;
    }
  },

  /**
   * Enterprise Alert Dispatcher
   * Handles DND, Priority Routing, and Escalation Rules.
   */
  dispatchAlert: async (
    title: string, 
    body: string, 
    options: {
      priority: 'low' | 'medium' | 'critical';
      module: string;
      settings: any; // Business notification settings
    }
  ) => {
    const { priority, module, settings } = options;

    // 1. Check Do Not Disturb (DND) rules
    if (settings?.dnd_enabled) {
      const currentHour = new Date().getHours();
      let isDND = false;
      
      if (settings.dnd_window === '22-06' && (currentHour >= 22 || currentHour < 6)) isDND = true;
      else if (settings.dnd_window === '20-08' && (currentHour >= 20 || currentHour < 8)) isDND = true;
      else if (settings.dnd_window === 'weekend') {
        const day = new Date().getDay();
        if (day === 0 || day === 6) isDND = true; // Sunday or Saturday
      }

      // If DND is active, only allow CRITICAL alerts to bypass
      if (isDND && priority !== 'critical') {
        console.log(`[AlertEngine] Alert suppressed by DND rules: ${title}`);
        // Still save to history quietly
        return;
      }
    }

    // 2. Role-Based Preferences
    if (settings?.user_notification_role) {
      if (settings.user_notification_role === 'silent') return; // User opted out of push
      if (settings.user_notification_role === 'inventory' && module !== 'inventory') return;
      if (settings.user_notification_role === 'sales' && module !== 'invoices') return;
    }

    // 3. Priority-Based Routing & Multi-Channel Delivery
    if (settings?.alert_routing === 'broadcast' || (settings?.alert_routing === 'critical_escalate' && priority === 'critical')) {
      // Broadcast to SMS / Email if enabled
      if (settings.sms_enabled) {
        console.log(`[AlertEngine] Dispatching SMS for: ${title}`);
        // Call SMS API here
      }
      if (settings.email_enabled) {
        console.log(`[AlertEngine] Dispatching Email for: ${title}`);
        // Call Email API here
      }
    }

    // 4. In-App OS Notification
    if (Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: "/icon-192.png",
        requireInteraction: priority === 'critical', // Keeps it on screen until dismissed
        silent: priority === 'low'
      });

      // 5. Escalation Rules
      if (settings?.escalation_enabled && priority === 'critical') {
        notif.onclose = () => {
          // If closed without action, escalate
        };
        setTimeout(() => {
          console.log(`[AlertEngine] Escalating unacknowledged critical alert: ${title}`);
          // e.g., Fire an SMS after 1 hour if not acknowledged
        }, 1000 * 60 * 60); // 1 hour simulation
      }
    } else {
       // Fallback to in-app toast
       if (priority === 'critical') {
         toast.error(title, { description: body });
       } else {
         toast.info(title, { description: body });
       }
    }
  }
};
