import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  FlaskConical,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  Sheet,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Link, routes } from "wasp/client/router";
import { FayaaLogo, Pill } from "../../client/design";
import { cn } from "../../client/utils";
import { SidebarLinkGroup } from "./SidebarLinkGroup";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);

  const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true",
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <aside
      ref={sidebar}
      className={cn(
        "z-9999 w-72.5 absolute left-0 top-0 flex h-screen flex-col overflow-y-hidden border-r border-fy-line bg-fy-surface-1/95 backdrop-blur-xl duration-300 ease-fy-out lg:static lg:translate-x-0",
        {
          "translate-x-0": sidebarOpen,
          "-translate-x-full": !sidebarOpen,
        },
      )}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="py-5.5 lg:py-6.5 flex items-center justify-between gap-2 px-6">
        <div className="flex items-center gap-3">
          <FayaaLogo to={routes.LandingPageRoute.to} />
          <Pill tone="accent">Owner</Pill>
        </div>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
        >
          <X />
        </button>
      </div>
      {/* <!-- SIDEBAR HEADER --> */}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* <!-- Sidebar Menu --> */}
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          {/* <!-- Menu Group --> */}
          <div>
            <h3 className="fy-eyebrow mb-3 ml-4">
              MENU
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {/* <!-- Menu Item Dashboard --> */}
              <NavLink
                to={routes.AdminRoute.to}
                end
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-2.5 rounded-fy-md px-4 py-2.5 text-sm font-medium text-fy-muted transition-colors duration-300 ease-fy-out hover:bg-white/5 hover:text-fy-text [&>svg]:size-4.5",
                    {
                      "bg-white/[0.07] text-fy-text before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-fy-accent": isActive,
                    },
                  )
                }
              >
                <LayoutDashboard />
                Overview
              </NavLink>

              <li>
                <NavLink
                  to={routes.AdminAnalyticsRoute.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2.5 rounded-fy-md px-4 py-2.5 text-sm font-medium text-fy-muted transition-colors duration-300 ease-fy-out hover:bg-white/5 hover:text-fy-text [&>svg]:size-4.5",
                      {
                        "bg-white/[0.07] text-fy-text before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-fy-accent": isActive,
                      },
                    )
                  }
                >
                  <BarChart3 />
                  Site traffic
                </NavLink>
              </li>

              {/* <!-- Menu Item Dashboard --> */}

              {/* <!-- Menu Item Users --> */}
              <li>
                <NavLink
                  to={routes.AdminUsersRoute.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2.5 rounded-fy-md px-4 py-2.5 text-sm font-medium text-fy-muted transition-colors duration-300 ease-fy-out hover:bg-white/5 hover:text-fy-text [&>svg]:size-4.5",
                      {
                        "bg-white/[0.07] text-fy-text before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-fy-accent": isActive,
                      },
                    )
                  }
                >
                  <Sheet />
                  Users
                </NavLink>
              </li>
              {/* <!-- Menu Item Users --> */}

              {/* <!-- Menu Item Site media --> */}
              <li>
                <NavLink
                  to={routes.AdminSiteMediaRoute.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2.5 rounded-fy-md px-4 py-2.5 text-sm font-medium text-fy-muted transition-colors duration-300 ease-fy-out hover:bg-white/5 hover:text-fy-text [&>svg]:size-4.5",
                      {
                        "bg-white/[0.07] text-fy-text before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-fy-accent": isActive,
                      },
                    )
                  }
                >
                  <Clapperboard />
                  Site media
                </NavLink>
              </li>

              {/* <!-- Menu Item Experiments --> */}
              <li>
                <NavLink
                  to={routes.AdminExperimentsRoute.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2.5 rounded-fy-md px-4 py-2.5 text-sm font-medium text-fy-muted transition-colors duration-300 ease-fy-out hover:bg-white/5 hover:text-fy-text [&>svg]:size-4.5",
                      {
                        "bg-white/[0.07] text-fy-text before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-fy-accent": isActive,
                      },
                    )
                  }
                >
                  <FlaskConical />
                  Experiments
                </NavLink>
              </li>

              {/* <!-- Menu Item Settings --> */}
              <li>
                <NavLink
                  to={routes.AdminSettingsRoute.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2.5 rounded-fy-md px-4 py-2.5 text-sm font-medium text-fy-muted transition-colors duration-300 ease-fy-out hover:bg-white/5 hover:text-fy-text [&>svg]:size-4.5",
                      {
                        "bg-white/[0.07] text-fy-text before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-fy-accent": isActive,
                      },
                    )
                  }
                >
                  <Settings />
                  Settings
                </NavLink>
              </li>
              {/* <!-- Menu Item Settings --> */}
            </ul>
          </div>

          {/* <!-- Others Group --> */}
          <div>
            <h3 className="fy-eyebrow mb-3 ml-4">
              Extra Components
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {/* <!-- Menu Item Calendar --> */}
              <li>
                <NavLink
                  to={routes.AdminCalendarRoute.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2.5 rounded-fy-md px-4 py-2.5 text-sm font-medium text-fy-muted transition-colors duration-300 ease-fy-out hover:bg-white/5 hover:text-fy-text [&>svg]:size-4.5",
                      {
                        "bg-white/[0.07] text-fy-text before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-fy-accent": isActive,
                      },
                    )
                  }
                >
                  <Calendar />
                  Calendar
                </NavLink>
              </li>
              {/* <!-- Menu Item Calendar --> */}

              {/* <!-- Menu Item Ui Elements --> */}
              <SidebarLinkGroup
                activeCondition={pathname === "/ui" || pathname.includes("ui")}
              >
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      <NavLink
                        to="#"
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-fy-md px-4 py-2.5 text-sm font-medium text-fy-muted transition-colors duration-300 ease-fy-out hover:bg-white/5 hover:text-fy-text [&>svg]:size-4.5",
                          {
                            "bg-accent text-accent-foreground":
                              pathname.includes("ui"),
                          },
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          if (sidebarExpanded) {
                            handleClick();
                          } else {
                            setSidebarExpanded(true);
                          }
                        }}
                      >
                        <LayoutTemplate />
                        UI Elements
                        {open ? <ChevronUp /> : <ChevronDown />}
                      </NavLink>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={cn("translate transform overflow-hidden", {
                          hidden: !open,
                        })}
                      >
                        <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
                          <li>
                            <NavLink
                              to={routes.AdminUIButtonsRoute.to}
                              end
                              className={({ isActive }) =>
                                cn(
                                  "text-muted-foreground hover:text-accent group relative flex items-center gap-2.5 rounded-md px-4 font-medium duration-300 ease-in-out",
                                  { "text-accent!": isActive },
                                )
                              }
                            >
                              Buttons
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              {/* <!-- Menu Item Ui Elements --> */}
            </ul>
          </div>
        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  );
}
