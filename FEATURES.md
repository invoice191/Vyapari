# Vyapari App - Simple Guide to All Features

## *Easy, Step-by-Step Guide Written for Shop Owners*

This guide explains how every part of the **Vyapari** app works in simple, everyday shop language. No computer jargon, no software secrets—just straightforward words to help you run your business smoothly.

---

## 1. Home (Your Daily Shop Summary)
**What it is for:** Checking the health of your shop in a quick glance.
**How to use it:** Look at the four main boxes to see today's status, read the friendly "Daily Shop Briefing" to understand how your sales are going, and see simple charts of your earnings.

### Simple Parts:
- **Daily Briefing (`DailyBriefing.tsx`)**: A short, helpful summary that tells you how your business is doing in plain words.
- **Shop Summary Cards (`KPICard.tsx`)**: Big, clear boxes showing important numbers with small, easy-to-read charts.
- **Home Screen (`Dashboard.tsx`)**: The main screen that brings all your shop summaries together.

### What it does for you:
1. **Clean Screen Layout**: Designed with large text and bright buttons so you can read it easily, even in a busy shop.
2. **Four Main Numbers**: 
   - **Money Made**: All cash and online payments received.
   - **Active Bills**: Total number of bills you have made.
   - **Low Stock Alerts**: Number of items that are about to run out.
   - **Pending Payments**: Number of customers who still need to pay you.
3. **Loyal & Churning Customers**: Finds customers who haven't visited in a while so you can send them a polite WhatsApp hello or payment reminder with one click.
4. **Days of Stock Remaining**: Automatically calculates exactly how many days of stock you have left based on how fast items are selling, so you know exactly when to order more.
5. **Smart Alerts**: Warns you immediately if something unusual happens (e.g., if a lot of stock disappears or if sales suddenly spike).
6. **Sales Forecast**: Shows simple charts predicting your sales over the next 7 days and 30 days so you can plan ahead.
7. **Best Selling Items**: Simple bar charts showing which product categories bring you the most business.

---

## 2. Home Dashboard (The Live Shop Monitor)
**What it is for:** Seeing your live shop activity and stock levels in a fun, visual way.
**How to use it:** Toggle between "Daily Work" and "Plan Ahead" views. Look at the interactive 3D box view to see which items are selling the fastest.

### Simple Parts:
- **3D Stock View (`3d/InventoryHeatmap.tsx`)**: A beautiful 3D box screen showing your stock. Big boxes mean you have plenty of stock; bright neon boxes mean that item is flying off the shelves!
- **Live Activity Feed (`CommandCenter.tsx`)**: A rolling list of things happening in your shop in real-time.

### What it does for you:
1. **Stock Speed Visualizer**: An easy 3D box chart. Big boxes show items with high stock. Neon means fast-selling, blue means stable, and red means slow-moving.
2. **Live Shop Stats**: Shows real-time counters of active customers, pending risks, and today's total collection.
3. **Smart Shop Alerts**: A scrolling message feed with useful tips (e.g., "Customers are buying more wheat this week, think about raising your stock").
4. **Quick Buttons**: Fast shortcut buttons to take action immediately, like ordering stock or sending a bill.

---

## 3. My Reports (Your Business Summary Sheets)
**What it is for:** Seeing deep summaries of your sales, stock, taxes, and exporting them to share with your CA or bank.
**How to use it:** Choose what report you want to see (Sales, Stock, GST, or Expenses), choose the dates, and click "Download PDF" to get a clean, print-ready document.

### Simple Parts:
- **Report Table (`ReportViewer.tsx`)**: A clean table showing your sales or purchases line by line.
- **Download PDF Box (`ExportModal.tsx`)**: A simple pop-up that creates a professional, print-ready PDF file.
- **PDF Design Templates (`executivePDF.ts` / `detailedPDF.ts`)**: Beautiful, high-quality styles that make your PDF reports look professional.

### What it does for you:
1. **Easy Dates and Filters**: Filter your reports by Today, This Month, or this Quarter. You can also filter by Cash vs. Online (UPI) sales, or how you value your stock (e.g., FIFO or average cost).
2. **Automatic Charts**: Automatically draws beautiful line, bar, or area charts showing your sales growth.
3. **Smart Advice**: Explains what the report numbers mean at the bottom and suggests what you should do next (e.g., "Your stock of item X is too high, try offering a small discount").
4. **Clean PDF Export**: Downloads a beautiful, formatted PDF report with your shop's logo, summary boxes, and charts.

---

## 4. Smart Tips (The Shop Checker)
**What it is for:** Getting smart advice on how to price your items, get paid on time, and keep your customers happy.
**How to use it:** Browse the suggestions provided, adjust the settings sliders to match how your shop runs, and follow the simple 3-part recommendations.

### Simple Parts:
- **Smart Tips Dashboard (`dss/DSS.tsx`)**: The main screen showing all helpful advice and suggestions.
- **Calculations Engine (`services/dss/dssService.ts`)**: The behind-the-scenes math that figures out which items are slow-moving and who your best customers are.

### What it does for you:
1. **Optimal Price Finder**: Suggests the best prices for your items so you make the maximum profit without losing your regular customers.
2. **Customer Groups**: Automatically groups your customers into "Regular Whales" (high spenders), "Loyal Friends", and "Quiet Customers" so you can offer special discounts or send gentle reminders.
3. **Competitor Pricing**: Estimates how changing your price will affect your sales volume compared to nearby wholesale shops.
4. **Money Flow Chart**: Shows a simple, beautiful step-by-step chart of your cash moving from the start of the month to your expected savings at the end.

---

## 5. What-If Calculator (The Sales Simulator)
**What it is for:** Predicting how much money you will make if you change your prices or run a sale.
**How to use it:** Choose any product, slide the price up or down, and see immediately how your sales and profits will change over the next week or month.

### Simple Parts:
- **Simulation Wizard (`prediction/Prediction.tsx`)**: A simple 3-step guide that walks you through running a price prediction.
- **Gemini AI Connection (`services/simulationService.ts`)**: The smart helper that uses Google's advanced models to predict customer reactions.

### What it does for you:
1. **Sales Path Comparison**: Draws a clean chart comparing your past sales, your current sales, and your predicted sales if you change the price.
2. **Interactive Sliders**: Real-time sliders let you adjust prices and timeframes easily.
3. **Impact Summary**: Shows you your expected profit, customer demand trends, and how confident Vyapari is in this tip.
4. **Action Steps**: Tells you exactly what to do (e.g., "Stock up on 12% more items before raising your price to handle the extra demand").

---

## 6. Bill Scanner (Scan a Bill)
**What it is for:** Scanning purchase bills from suppliers using your phone camera or an uploaded file, saving you from manual typing.
**How to use it:** Upload a photo or PDF of a supplier's bill, check the found details, and click "Confirm & Save Bill" to instantly update your stock and purchase records.

### Simple Parts:
- **Bill Scanner Screen (`ocr/OCR.tsx`)**: The drag-and-drop screen where you upload bills and review the found details.
- **Smart Bill Reader (`ocr-service` Edge Function)**: The AI engine that reads text, quantities, and prices from photos.

### What it does for you:
1. **Photo-to-Stock**: Instantly reads the supplier name, date, items, tax, and totals with high accuracy.
2. **Easy Double-Check**: Highlights any values that were slightly blurry so you can easily review and correct them before saving.
3. **Auto-Stock Update**: Instantly adds the scanned items to your stock levels and records the purchase under your transactions.

---

## 7. Bills & Orders (Making Bills & Tracking Payments)
**What it is for:** Creating sales bills for customers and keeping track of unpaid balances.
**How to use it:** Click "New Bill" or use your Voice Helper to add items, save the bill, and click the WhatsApp icon to send a polite payment reminder.

### Simple Parts:
- **Bills Screen (`invoices/Invoices.tsx`)**: The main list of all sales bills, sorted by Paid, Unpaid, or Overdue.
- **Bill Creator (`invoices/InvoiceCreator.tsx`)**: A fast, easy bill builder that checks your stock in real-time as you type.

### What it does for you:
1. **Real-Time Stock Check**: Prevents you from billing an item if you don't have enough stock on your shelf.
2. **Auto Bill Numbers**: Generates invoice/bill numbers automatically so your books stay clean and organized.
3. **Friendly Reminders**: Tells you exactly how many days a payment is overdue and gives you a pre-written WhatsApp message to send with a single tap.

---

## 8. My Stock (Stock Levels & Alerts)
**What it is for:** Keeping track of every item you sell, knowing what is about to finish, and seeing stock history.
**How to use it:** Scroll through your items, use the fast search bar, and look for red "Out of stock" or yellow "Almost finished" flags.

### Simple Parts:
- **Stock Screen (`inventory/Inventory.tsx`)**: Your master list of all products, quantities, purchase prices, and selling prices.
- **Safe Stock Updates (`deduct_stock_safe` Database Function)**: Ensures that even if two customers buy the last item at the exact same second, your stock count updates safely and correctly.

### What it does for you:
1. **Low Stock Warnings**: Bright flags show you what items are running low so you can order more before your shelves go empty.
2. **Smart Search**: Quickly find any product by typing just a few letters—it prioritizes items you sell most often.
3. **Stock History Trail**: Shows you a detailed history of every time an item was added, sold, or modified, so you always know where your stock went.

---

## 9. Loan Readiness Report (Banker's View)
**What it is for:** Showing your business growth and cash health to a bank manager to secure a business loan easily.
**How to use it:** Open this screen to view clean financial health indicators that banks look for, demonstrating your shop's high reliability.

### What it does for you:
1. **Cash Runway Forecast**: Shows how many months your business can operate smoothly based on your current cash reserves and regular sales.
2. **Financial Health Indicators**: Calculates standard bank metrics like liquidity and debt-to-equity in simple terms, proving your shop is safe for a loan.

---

## 10. System Modules (Shop Settings & Logs)
- **Settings**: Easily configure your shop's name, phone, GST number, and billing details.
- **User Accounts**: Create separate logins for your staff (Employee) or CA (Banker) so they can use the app without seeing sensitive owner details.
- **Activity History**: A live, locked list of everything done in the app (e.g., who logged in, who deleted a bill, who changed a price), keeping your shop completely secure.

---

## 11. Voice Helper (Speak to Vyapari)
**What it is for:** Running your entire shop hands-free by speaking in normal language.
**How to use it:** Tap the microphone icon, say "Vyapari" or "VANI", and say commands like "Show me items about to finish" or "Make a bill for Rajesh".

### What it does for you:
- **Understand Normal Talk**: Understands how you talk naturally and automatically opens the right screen or takes the right action.
- **Speaks Back to You**: Speaks back politely to confirm what it did or read out a quick summary of your daily sales.

---

## 12. Zero-Touch Automation (Autonomous Shop)
**What it is for:** Letting the app handle boring paperwork and verification automatically so you can focus on your customers.
**How to use it:** Turn on the "Auto-Pilot" settings. The app will automatically match payments and verify deliveries for you.

### Simple Parts:
- **Auto-Payment Matcher (`AutoRecon`)**: Automatically matches money coming into your bank with your unpaid bills.
- **Photo Delivery Check (`vPOD`)**: Uses AI to look at delivery photos and confirm the customer received their items.

### What it does for you:
1. **No-Type Reconciliation**: You don't have to manually mark bills as "Paid"—the app does it for you when it sees the money in your account.
2. **Instant Delivery Proof**: Automatically updates your bills to "Delivered" as soon as a delivery photo is uploaded, saving you hours of phone calls.
3. **Smart Credit Blocking**: Automatically stops sales on credit to customers who haven't paid their old bills or are high-risk.
4. **Early-Bird Discounts**: Automatically offers small discounts to customers who pay early, helping you keep more cash in your shop's drawer.
