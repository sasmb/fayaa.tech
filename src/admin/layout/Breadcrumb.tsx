import { Link as WaspRouterLink, routes } from "wasp/client/router";
interface BreadcrumbProps {
  pageName: string;
}
export function Breadcrumb({ pageName }: BreadcrumbProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
        {pageName}
      </h2>

      <nav>
        <ul className="flex items-center gap-1.5 text-sm text-fy-subtle">
          <li>
            <WaspRouterLink to={routes.AdminRoute.to}>Dashboard</WaspRouterLink>
          </li>
          <li>/</li>
          <li className="font-medium text-fy-text">{pageName}</li>
        </ul>
      </nav>
    </div>
  );
}
