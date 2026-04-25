import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "renewal day-before alerts",
  "30 2 * * *", // 02:30 UTC = 08:00 IST
  internal.alerts.scanAndSend,
  {},
);

crons.interval(
  "24h file cleanup",
  { hours: 1 },
  internal.cleanup.sweep,
  {},
);

export default crons;
