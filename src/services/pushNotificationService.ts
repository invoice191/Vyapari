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
   * Local trigger hook to simulate incoming cloud alert
   */
  sendLocalAlert: (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: "/icon-192.png",
        silent: false
      });
    }
  }
};
