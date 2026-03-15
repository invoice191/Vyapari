import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Simulated OCR Endpoint
  app.post("/api/ocr/process", (req, res) => {
    const { imageUrl } = req.body;
    console.log(`Processing OCR for: ${imageUrl}`);
    
    // Simulate processing delay
    setTimeout(() => {
      res.json({
        success: true,
        data: {
          vendor: "Global Retail Supplies",
          date: "2024-03-14",
          totalAmount: 1250.50,
          items: [
            { description: "Organic Apples", quantity: 50, price: 2.50 },
            { description: "Fresh Milk", quantity: 20, price: 3.25 }
          ]
        }
      });
    }, 1500);
  });

  // Simulation Engine Endpoint
  app.post("/api/simulation/run", (req, res) => {
    const { parameters } = req.body;
    console.log("Running simulation with parameters:", parameters);
    
    // Simulate complex calculation
    const result = {
      projectedRevenue: parameters.price * parameters.volume * 1.1,
      confidence: 0.85,
      recommendation: "Increase stock levels by 15% for next quarter"
    };
    
    res.json(result);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
