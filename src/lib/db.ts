import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "search_history.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
      CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        product_name TEXT,
        product_category TEXT,
        product_description TEXT,
        product_brand TEXT,
        search_query TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS search_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        search_id INTEGER NOT NULL,
        title TEXT,
        url TEXT,
        snippet TEXT,
        price TEXT,
        source TEXT,
        FOREIGN KEY (search_id) REFERENCES searches(id) ON DELETE CASCADE
      );
    `);
  }
  return db;
}

export interface SaveSearchParams {
  image: string;
  mimeType: string;
  productName: string;
  productCategory: string;
  productDescription: string;
  productBrand: string;
  searchQuery: string;
  results: {
    title: string;
    url: string;
    snippet: string;
    price: string | null;
    source: string;
  }[];
}

export function saveSearch(params: SaveSearchParams): number {
  const db = getDb();

  const insertSearch = db.prepare(`
    INSERT INTO searches (image, mime_type, product_name, product_category, product_description, product_brand, search_query)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertResult = db.prepare(`
    INSERT INTO search_results (search_id, title, url, snippet, price, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((p: SaveSearchParams) => {
    const { lastInsertRowid } = insertSearch.run(
      p.image,
      p.mimeType,
      p.productName,
      p.productCategory,
      p.productDescription,
      p.productBrand,
      p.searchQuery
    );
    const searchId = Number(lastInsertRowid);

    for (const r of p.results) {
      insertResult.run(searchId, r.title, r.url, r.snippet, r.price, r.source);
    }

    return searchId;
  });

  return transaction(params);
}

export interface SearchRecord {
  id: number;
  image: string;
  mime_type: string;
  product_name: string;
  product_category: string;
  product_description: string;
  product_brand: string;
  search_query: string;
  created_at: string;
  results: {
    title: string;
    url: string;
    snippet: string;
    price: string | null;
    source: string;
  }[];
}

export function getSearchHistory(limit = 20): SearchRecord[] {
  const db = getDb();

  const searches = db
    .prepare("SELECT * FROM searches ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Omit<SearchRecord, "results">[];

  const getResults = db.prepare(
    "SELECT title, url, snippet, price, source FROM search_results WHERE search_id = ?"
  );

  return searches.map((s) => ({
    ...s,
    results: getResults.all(s.id) as SearchRecord["results"],
  }));
}

export function getSearchById(id: number): SearchRecord | null {
  const db = getDb();

  const search = db
    .prepare("SELECT * FROM searches WHERE id = ?")
    .get(id) as Omit<SearchRecord, "results"> | undefined;

  if (!search) return null;

  const results = db
    .prepare("SELECT title, url, snippet, price, source FROM search_results WHERE search_id = ?")
    .all(id) as SearchRecord["results"];

  return { ...search, results };
}
