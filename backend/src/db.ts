import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.PGHOST ?? process.env.DB_HOST ?? "localhost",
  port: Number(process.env.PGPORT ?? process.env.DB_PORT ?? 5432),
  database: process.env.PGDATABASE ?? process.env.DB_NAME ?? "listra_db",
  user: process.env.PGUSER ?? process.env.DB_USER ?? "postgres",
  password: process.env.PGPASSWORD ?? process.env.DB_PASSWORD ?? "postgres",
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});
