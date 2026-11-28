import { type AuthUser } from "wasp/auth";
import { Link } from "react-router";
import { ArrowUpRight, Clapperboard } from "lucide-react";
import { cn } from "../../client/utils";
import { UserDropdown } from "../../user/UserDropdown";
import { MessageButton } from "../dashboards/messages/MessageButton";

export function Header(props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
  user: AuthUser;
}) {
  return (
    <header className="sticky top-0 z-10 flex w-full border-b border-fy-line bg-fy-ink/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex grow items-center justify-between px-4 py-3.5 sm:justify-end sm:gap-4 md:px-8">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* <!-- Hamburger Toggle BTN --> */}

          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 block rounded-fy-sm border border-fy-line bg-fy-surface-2 p-1.5 lg:hidden"
          >
            <span className="h-5.5 w-5.5 relative block cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span
                  className={cn(
                    "bg-foreground relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm delay-0 duration-200 ease-in-out",
                    {
                      "w-full! delay-300": !props.sidebarOpen,
                    },
                  )}
                ></span>
                <span
                  className={cn(
                    "bg-foreground relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm delay-150 duration-200 ease-in-out",
                    {
                      "w-full! delay-400": !props.sidebarOpen,
                    },
                  )}
                ></span>
                <span
                  className={cn(
                    "bg-foreground relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm delay-200 duration-200 ease-in-out",
                    {
                      "w-full! delay-500": !props.sidebarOpen,
                    },
                  )}
                ></span>
              </span>
              <span className="absolute right-0 h-full w-full rotate-45">
                <span
                  className={cn(
                    "bg-foreground absolute left-2.5 top-0 block h-full w-0.5 rounded-sm delay-300 duration-200 ease-in-out",
                    {
                      "h-0! delay-0!": !props.sidebarOpen,
                    },
                  )}
                ></span>
                <span
                  className={cn(
                    "bg-foreground delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm duration-200 ease-in-out",
                    {
                      "h-0! delay-200!": !props.sidebarOpen,
                    },
                  )}
                ></span>
              </span>
            </span>
          </button>

          {/* <!-- Hamburger Toggle BTN --> */}
        </div>

        <ul className="2xsm:gap-4 flex items-center gap-2">
          <li className="hidden sm:block">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-fy-muted transition-colors hover:bg-white/5 hover:text-fy-text"
            >
              View site
              <ArrowUpRight className="size-3.5" />
            </Link>
          </li>
          <li className="hidden sm:block">
            <Link
              to="/studio"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-fy-accent/30 bg-fy-accent/10 px-3.5 text-sm font-semibold text-fy-accent-300 transition-colors hover:bg-fy-accent/20"
            >
              <Clapperboard className="size-3.5" />
              Studio
            </Link>
          </li>

          {/* <!-- Chat Notification Area --> */}
          <MessageButton />
          {/* <!-- Chat Notification Area --> */}
        </ul>

        <div className="2xsm:gap-7 flex items-center gap-3">
          {/* <!-- User Area --> */}
          <UserDropdown user={props.user} />
          {/* <!-- User Area --> */}
        </div>
      </div>
    </header>
  );
}
