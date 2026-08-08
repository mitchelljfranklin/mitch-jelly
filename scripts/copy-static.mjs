import { cpSync } from "fs";

cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
console.log("Copied .next/static/ to standalone");
