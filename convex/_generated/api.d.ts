/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accounts from "../accounts.js";
import type * as activities from "../activities.js";
import type * as cliqNotices from "../cliqNotices.js";
import type * as cliqs from "../cliqs.js";
import type * as feedback from "../feedback.js";
import type * as invites from "../invites.js";
import type * as memberships from "../memberships.js";
import type * as migrate from "../migrate.js";
import type * as migrations_removeNameFields from "../migrations/removeNameFields.js";
import type * as parentApprovals from "../parentApprovals.js";
import type * as parentConsents from "../parentConsents.js";
import type * as parentLinks from "../parentLinks.js";
import type * as plans from "../plans.js";
import type * as posts from "../posts.js";
import type * as profiles from "../profiles.js";
import type * as redAlerts from "../redAlerts.js";
import type * as scrapbook from "../scrapbook.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  activities: typeof activities;
  cliqNotices: typeof cliqNotices;
  cliqs: typeof cliqs;
  feedback: typeof feedback;
  invites: typeof invites;
  memberships: typeof memberships;
  migrate: typeof migrate;
  "migrations/removeNameFields": typeof migrations_removeNameFields;
  parentApprovals: typeof parentApprovals;
  parentConsents: typeof parentConsents;
  parentLinks: typeof parentLinks;
  plans: typeof plans;
  posts: typeof posts;
  profiles: typeof profiles;
  redAlerts: typeof redAlerts;
  scrapbook: typeof scrapbook;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
