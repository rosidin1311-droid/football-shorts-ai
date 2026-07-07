import fs from "fs";
import path from "path";
import { ShortJob } from "../src/types.js";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure the data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial DB template
const initialDB = {
  jobs: [] as ShortJob[]
};

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), "utf-8");
      return initialDB;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, returning default:", err);
    return initialDB;
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

export const Storage = {
  getJobs(): ShortJob[] {
    const db = readDB();
    return db.jobs || [];
  },

  getJob(id: string): ShortJob | undefined {
    const jobs = this.getJobs();
    return jobs.find((job) => job.id === id);
  },

  saveJob(job: ShortJob): void {
    const db = readDB();
    const index = db.jobs.findIndex((j: ShortJob) => j.id === job.id);
    if (index >= 0) {
      db.jobs[index] = job;
    } else {
      db.jobs.push(job);
    }
    writeDB(db);
  },

  deleteJob(id: string): void {
    const db = readDB();
    db.jobs = db.jobs.filter((j: ShortJob) => j.id !== id);
    writeDB(db);
  },

  clearAllJobs(): void {
    writeDB({ jobs: [] });
  }
};
