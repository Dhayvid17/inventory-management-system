//utils/routeConfig.ts
export const ROUTE_ACCESS = {
  USER_ROUTES: ["/dashboard", "/profile", "/categories"],
  STAFF_ROUTES: ["/categories/create", "/categories/edit"],
  ADMIN_ROUTES: ["/users/manage", "/settings/system", "/categories/delete"],
} as const;
