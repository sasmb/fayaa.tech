import { action, page, query, route, type Spec } from "@wasp.sh/spec";

import { AnalyticsDashboardPage } from "./dashboards/analytics/AnalyticsDashboardPage" with { type: "ref" };
import { OwnerOverviewPage } from "./dashboards/overview/OwnerOverviewPage" with { type: "ref" };
import {
  getAdminOverview,
  syncStripePayments,
} from "./overview/operations" with { type: "ref" };
import { MessagesPage } from "./dashboards/messages/MessagesPage" with { type: "ref" };
import { UsersDashboardPage } from "./dashboards/users/UsersDashboardPage" with { type: "ref" };
import { CalendarPage } from "./elements/calendar/CalendarPage" with { type: "ref" };
import { SettingsPage } from "./elements/settings/SettingsPage" with { type: "ref" };
import { ButtonsPage } from "./elements/ui-elements/ButtonsPage" with { type: "ref" };

export const adminSpec: Spec = [
  route(
    "AdminRoute",
    "/admin",
    page(OwnerOverviewPage, { authRequired: true }),
  ),
  route(
    "AdminAnalyticsRoute",
    "/admin/analytics",
    page(AnalyticsDashboardPage, { authRequired: true }),
  ),
  query(getAdminOverview, {
    entities: ["User", "Payment", "VideoTask", "LongVideoJob"],
  }),
  action(syncStripePayments, { entities: ["User", "Payment"] }),
  route(
    "AdminUsersRoute",
    "/admin/users",
    page(UsersDashboardPage, { authRequired: true }),
  ),
  route(
    "AdminSettingsRoute",
    "/admin/settings",
    page(SettingsPage, { authRequired: true }),
  ),
  route(
    "AdminCalendarRoute",
    "/admin/calendar",
    page(CalendarPage, { authRequired: true }),
  ),
  route(
    "AdminUIButtonsRoute",
    "/admin/ui/buttons",
    page(ButtonsPage, { authRequired: true }),
  ),
  route(
    "AdminMessagesRoute",
    "/admin/messages",
    page(MessagesPage, { authRequired: true }),
  ),
];
