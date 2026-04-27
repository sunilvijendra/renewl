/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as alerts from "../alerts.js";
import type * as auth from "../auth.js";
import type * as cleanup from "../cleanup.js";
import type * as crons from "../crons.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_emailTemplates from "../lib/emailTemplates.js";
import type * as parseJobs from "../parseJobs.js";
import type * as parser from "../parser.js";
import type * as pendingParses from "../pendingParses.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  alerts: typeof alerts;
  auth: typeof auth;
  cleanup: typeof cleanup;
  crons: typeof crons;
  feedback: typeof feedback;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/dates": typeof lib_dates;
  "lib/emailTemplates": typeof lib_emailTemplates;
  parseJobs: typeof parseJobs;
  parser: typeof parser;
  pendingParses: typeof pendingParses;
  subscriptions: typeof subscriptions;
  users: typeof users;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
