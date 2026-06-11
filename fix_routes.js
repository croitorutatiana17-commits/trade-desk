const fs = require("fs");
const path = require("path");

const D = path.join(__dirname, "src/routes");
const D32 = String.fromCharCode(36); // $

// Remove all stale files with ".."
for (const f of fs.readdirSync(D)) {
  if (f.includes("..")) fs.unlinkSync(path.join(D, f));
}

// Write jobs.$jobId.tsx from jobs.tsx
const jobsContent = fs.readFileSync(path.join(D, "jobs.tsx"), "utf-8");
fs.writeFileSync(path.join(D, "jobs." + D32 + "jobId.tsx"), jobsContent);

// Write customers.$customerId.tsx from customers.tsx
const custContent = fs.readFileSync(path.join(D, "customers.tsx"), "utf-8");
fs.writeFileSync(path.join(D, "customers." + D32 + "customerId.tsx"), custContent);

// Write invoices.$invoiceId.tsx from invoices.tsx
const invContent = fs.readFileSync(path.join(D, "invoices.tsx"), "utf-8");
fs.writeFileSync(path.join(D, "invoices." + D32 + "invoiceId.tsx"), invContent);

console.log("Files:", fs.readdirSync(D));