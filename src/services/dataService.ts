import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../utils/firestoreErrorHandler";

export interface Sale {
  id?: string;
  amount: number;
  items: number;
  timestamp: any;
  category: string;
  paymentMethod: string;
  itemIds?: string[]; // Added to track which items were sold
  customerName?: string;
}

export interface InventoryItem {
  id?: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  margin: number;
  description?: string;
}

export interface StockLog {
  id?: string;
  itemId: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  previousStock: number;
  newStock: number;
  timestamp: any;
  reason?: string;
}

export const getSalesSummary = (callback: (data: any[]) => void) => {
  const path = "sales";
  const q = query(collection(db, path), orderBy("timestamp", "desc"), limit(100));
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sales);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const getDailySales = (callback: (data: any[]) => void) => {
  const path = "sales";
  const q = query(collection(db, path), orderBy("timestamp", "desc"), limit(500));
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({
      ...doc.data(),
      date: (doc.data() as any).timestamp?.toDate() || new Date()
    }));
    
    // Simple aggregation by date
    const daily: Record<string, any> = {};
    sales.forEach((s: any) => {
      const dStr = s.date.toLocaleDateString("en-IN");
      if (!daily[dStr]) {
        daily[dStr] = { date: dStr, txns: 0, gross: 0, net: 0, profit: 0, tax: 0, disc: 0 };
      }
      daily[dStr].txns += 1;
      daily[dStr].gross += s.amount;
      daily[dStr].net += s.amount * 0.92; // Simulated net
      daily[dStr].tax += s.amount * 0.08;
      daily[dStr].profit += s.amount * 0.25;
    });
    
    callback(Object.values(daily).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const getInventorySummary = (callback: (data: any[]) => void) => {
  const path = "inventory";
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const getInventoryValuation = (callback: (data: any) => void) => {
  const path = "inventory";
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => doc.data());
    const totalValue = items.reduce((acc, item: any) => acc + (item.stock * item.price), 0);
    const totalItems = items.reduce((acc, item: any) => acc + item.stock, 0);
    const categories = items.reduce((acc: any, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + (item.stock * item.price);
      return acc;
    }, {});
    
    callback({
      totalValue,
      totalItems,
      categoryBreakdown: Object.entries(categories).map(([name, value]) => ({ name, value }))
    });
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const addInventoryItem = async (item: Omit<InventoryItem, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "inventory"), {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Log initial stock
    await logStockChange(docRef.id, item.stock, 0, item.stock, "Initial Stock Registration", "in");
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "inventory");
  }
};

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
  try {
    const itemRef = doc(db, "inventory", id);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `inventory/${id}`);
  }
};

export const deleteInventoryItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, "inventory", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `inventory/${id}`);
  }
};

export const logStockChange = async (itemId: string, quantity: number, previousStock: number, newStock: number, reason: string, type: "in" | "out") => {
  try {
    await addDoc(collection(db, "stock_logs"), {
      itemId,
      quantity,
      previousStock,
      newStock,
      reason,
      type,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "stock_logs");
  }
};

export const getItemLogs = (itemId: string, callback: (logs: StockLog[]) => void) => {
  const q = query(
    collection(db, "stock_logs"),
    where("itemId", "==", itemId),
    orderBy("timestamp", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockLog));
    callback(logs);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, "stock_logs");
  });
};

export const getItemSalesLogs = (itemId: string, callback: (sales: any[]) => void) => {
  const q = query(
    collection(db, "sales"),
    where("itemIds", "array-contains", itemId),
    orderBy("timestamp", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(sales);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, "sales");
  });
};

export const getInvoicesSummary = (callback: (data: any[]) => void) => {
  const path = "invoices";
  const q = query(collection(db, path), orderBy("date", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(invoices);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const seedInitialData = async () => {
  try {
    const inventoryRef = collection(db, "inventory");
    const inventorySnap = await getDocs(query(inventoryRef, limit(1)));
    
    if (inventorySnap.empty) {
      console.log("Seeding initial inventory...");
      const initialInventory = [
        { name: "Rice 5kg", category: "Groceries", stock: 15, minStock: 20, price: 450, margin: 15 },
        { name: "Cooking Oil 1L", category: "Groceries", stock: 8, minStock: 15, price: 180, margin: 12 },
        { name: "Detergent 1kg", category: "Household", stock: 45, minStock: 10, price: 120, margin: 20 },
        { name: "Milk 500ml", category: "Dairy", stock: 120, minStock: 50, price: 30, margin: 8 },
        { name: "Bread", category: "Bakery", stock: 30, minStock: 10, price: 40, margin: 25 },
        { name: "Eggs 12pk", category: "Dairy", stock: 25, minStock: 15, price: 80, margin: 10 },
      ];
      
      for (const item of initialInventory) {
        await addDoc(inventoryRef, item);
      }
    }

    const salesRef = collection(db, "sales");
    const salesSnap = await getDocs(query(salesRef, limit(1)));
    
    if (salesSnap.empty) {
      console.log("Seeding initial sales...");
      const categories = ["Groceries", "Household", "Dairy", "Bakery"];
      const methods = ["Cash", "UPI", "Card"];
      
      for (let i = 0; i < 20; i++) {
        await addDoc(salesRef, {
          amount: Math.floor(Math.random() * 2000) + 100,
          items: Math.floor(Math.random() * 10) + 1,
          category: categories[Math.floor(Math.random() * categories.length)],
          paymentMethod: methods[Math.floor(Math.random() * methods.length)],
          timestamp: serverTimestamp()
        });
      }
    }

    const invoicesRef = collection(db, "invoices");
    const invoicesSnap = await getDocs(query(invoicesRef, limit(1)));
    if (invoicesSnap.empty) {
      console.log("Seeding initial invoices...");
      const mockInvoices = [
        { id: "INV-2024-001", customer: "Meera Textiles", date: "2024-01-15", amount: 128500, status: "Paid", method: "Bank Transfer" },
        { id: "INV-2024-002", customer: "Sundar Traders", date: "2024-01-18", amount: 89000, status: "Pending", method: "UPI" },
        { id: "INV-2024-003", customer: "Global Exports", date: "2024-01-20", amount: 245000, status: "Paid", method: "Bank Transfer" },
        { id: "INV-2024-004", customer: "Local Mart", date: "2024-01-22", amount: 23400, status: "Overdue", method: "Cash" },
        { id: "INV-2024-005", customer: "Apex Solutions", date: "2024-01-25", amount: 56700, status: "Pending", method: "UPI" },
      ];
      for (const inv of mockInvoices) {
        await addDoc(invoicesRef, inv);
      }
    }
  } catch (error) {
    // We don't want to crash the app if seeding fails (e.g. due to permissions)
    // but we should log it properly
    console.error("Seeding failed:", error);
  }
};
