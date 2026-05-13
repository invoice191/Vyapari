export const vaniExecutor = {
  processCommand: (transcript: string, setActive: (module: string) => void) => {
    const t = transcript.toLowerCase();
    
    if (t.includes('dashboard') || t.includes('home')) {
      setActive('dashboard');
      return "Navigating to Dashboard";
    }
    if (t.includes('inventory') || t.includes('stock')) {
      setActive('inventory');
      return "Opening Inventory Management";
    }
    if (t.includes('invoice') || t.includes('sales')) {
      setActive('invoices');
      return "Opening Invoices";
    }
    if (t.includes('scan') || t.includes('ocr')) {
      setActive('ocr');
      return "Opening Neural Scanner";
    }
    if (t.includes('ledger') || t.includes('transaction')) {
      setActive('ledger');
      return "Opening Transactional Ledger";
    }
    if (t.includes('command') || t.includes('war room')) {
      setActive('command');
      return "Entering Command Center";
    }
    if (t.includes('audit') || t.includes('history')) {
      setActive('audit');
      return "Opening Audit Logs";
    }
    if (t.includes('report') || t.includes('analysis')) {
      setActive('reports');
      return "Opening Strategic Reports";
    }
    
    return "I heard you, but I'm not sure how to execute that command yet.";
  }
};
