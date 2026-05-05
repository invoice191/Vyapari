import { useState, useEffect } from "react";
import { inventoryService } from "../../services/inventoryService";
import { Card, Badge, SectionHeader } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchInventory();
  }, [page, search, category]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, count } = await inventoryService.getProducts(page, pageSize, search, category);
      setItems(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="brutal-card bg-white">
          <div className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-2">TOTAL_SKUS</div>
          <div className="text-4xl font-black tracking-tighter">{totalCount}</div>
        </div>
        <div className="brutal-card bg-white">
          <div className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-2">LOW_STOCK_ALERTS</div>
          <div className="text-4xl font-black tracking-tighter text-neon">
            {items.filter(i => i.stock?.[0]?.quantity < i.min_stock).length}
          </div>
        </div>
        <div className="brutal-card bg-white">
          <div className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-2">VALUATION</div>
          <div className="text-4xl font-black tracking-tighter text-ink">₹{(items.reduce((a, b) => a + (b.price * (b.stock?.[0]?.quantity || 0)), 0) / 1000).toFixed(1)}K</div>
        </div>
      </div>

      <div className="brutal-card bg-white">
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-start lg:items-center">
          <div className="relative flex-1 w-full">
            <input
              placeholder="SEARCH_PRODUCTS..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="brutal-input w-full"
            />
          </div>
          <select 
            className="brutal-input lg:w-48"
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
          >
            <option value="All">ALL_CATEGORIES</option>
            <option value="Groceries">GROCERIES</option>
            <option value="Dairy">DAIRY</option>
            <option value="Bakery">BAKERY</option>
          </select>
          <button className="brutal-btn">+ ADD_PRODUCT</button>
        </div>

        <div className="overflow-x-auto border-2 border-ink">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-ink text-white font-black text-[10px] uppercase tracking-widest">
                <th className="p-4">PRODUCT_NAME</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">STOCK_LEVEL</th>
                <th className="p-4">PRICE</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center font-black text-ink/20">LOADING_INVENTORY...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center font-black text-ink/20">NO_ITEMS_FOUND</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-b border-ink/5 hover:bg-neon/5 transition-colors">
                  <td className="p-4 font-black uppercase text-xs">{item.name}</td>
                  <td className="p-4 font-bold text-[10px] text-ink/40 uppercase">{item.category}</td>
                  <td className="p-4 font-mono font-bold">
                    <span className={item.stock?.[0]?.quantity < item.min_stock ? "text-neon" : ""}>
                      {item.stock?.[0]?.quantity || 0}
                    </span>
                    <span className="text-ink/20 ml-2">/ {item.min_stock} MIN</span>
                  </td>
                  <td className="p-4 font-black">₹{item.price}</td>
                  <td className="p-4">
                    <Badge status={item.stock?.[0]?.quantity > item.min_stock ? "Paid" : item.stock?.[0]?.quantity > 0 ? "Pending" : "Overdue"} />
                  </td>
                  <td className="p-4">
                    <button className="text-[10px] font-black underline hover:text-neon">EDIT</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-8">
          <div className="text-[10px] font-black text-ink/40">
            SHOWING {items.length} OF {totalCount} ENTRIES
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border-2 border-ink font-black text-[10px] disabled:opacity-20"
            >
              PREV
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 border-2 border-ink font-black text-[10px] ${page === i + 1 ? 'bg-ink text-white' : 'bg-white text-ink'}`}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border-2 border-ink font-black text-[10px] disabled:opacity-20"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
