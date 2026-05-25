export const vaniExecutor = {
  processCommand: (transcript: string, setActive: (module: string) => void) => {
    const t = transcript.toLowerCase();
    
    const triggerNav = (m: string) => {
      setActive(m);
      window.dispatchEvent(new CustomEvent('app:navigate', { detail: { module: m } }));
    };

    if (t.includes('dashboard') || t.includes('home')) {
      triggerNav('dashboard');
      return "Navigating to Dashboard";
    }
    if (t.includes('inventory') || t.includes('stock')) {
      triggerNav('inventory');
      return "Opening Inventory Management";
    }
    if (t.includes('invoice') || t.includes('sales')) {
      triggerNav('invoices');
      return "Opening Invoices";
    }
    if (t.includes('scan') || t.includes('ocr')) {
      triggerNav('ocr');
      return "Opening Neural Scanner";
    }
    if (t.includes('ledger') || t.includes('transaction')) {
      triggerNav('ledger');
      return "Opening Transactional Ledger";
    }
    if (t.includes('command') || t.includes('war room')) {
      triggerNav('command');
      return "Entering Command Center";
    }
    if (t.includes('audit') || t.includes('history')) {
      triggerNav('audit');
      return "Opening Audit Logs";
    }
    if (t.includes('report') || t.includes('analysis')) {
      triggerNav('reports');
      return "Opening Strategic Reports";
    }
    
    return "I heard you, but I'm not sure how to execute that command yet.";
  }
};
