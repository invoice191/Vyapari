import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("Missing SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const fetchSchema = async () => {
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("--- TABLES AND COLUMNS IN DATABASE ---");
    
    if (data.definitions) {
      for (const [tableName, definition] of Object.entries(data.definitions)) {
        console.log(`\nTable: ${tableName}`);
        if (definition.properties) {
          const cols = Object.keys(definition.properties).join(', ');
          console.log(`  Columns: ${cols}`);
        }
      }
    } else {
      console.log("No definitions found in response:", Object.keys(data));
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
};

fetchSchema();
