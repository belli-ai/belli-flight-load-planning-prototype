"use client";

import Link from "next/link";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Plane,
  Package,
  Scale,
  Settings,
  Calendar,
  Boxes,
  Database,
  LogOut,
  User,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
};

const operationsItems: NavItem[] = [
  {
    title: "Flight Schedule",
    href: "/dashboard/flights",
    description: "View and manage flight schedules",
    icon: <Calendar className="size-4" />,
  },
  {
    title: "Cargo Management",
    href: "/dashboard/cargo",
    description: "Track AWBs and cargo items",
    icon: <Package className="size-4" />,
  },
];

const planningItems: NavItem[] = [
  {
    title: "Build Up",
    href: "/dashboard/build-up",
    description: "ULD build up and packing",
    icon: <Boxes className="size-4" />,
  },
  {
    title: "Load Balancing",
    href: "/dashboard/load-balancing",
    description: "Weight & balance optimization",
    icon: <Scale className="size-4" />,
  },
];

const systemItems: NavItem[] = [
  {
    title: "Aircraft Config",
    href: "/dashboard/aircraft",
    description: "Aircraft types and positions",
    icon: <Plane className="size-4" />,
  },
  {
    title: "Reference Data",
    href: "/dashboard/reference-data",
    description: "Locations, codes, and settings",
    icon: <Database className="size-4" />,
  },
];

function NavMenuGroup({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-foreground data-[state=open]:text-foreground">
        {title}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[280px] gap-1 p-2">
          {items.map((item) => (
            <li key={item.href}>
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-start gap-3 rounded-sm p-3 transition-colors",
                    "hover:bg-foreground/10",
                    "focus:bg-foreground/10"
                  )}
                >
                  <div className="mt-0.5 text-primary">{item.icon}</div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-none text-foreground">
                      {item.title}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/air_china_cargo_logo.png"
            alt="Air China Cargo"
            width={150}
            height={45}
            priority
          />
        </Link>

        {/* Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavMenuGroup title="Operations" items={operationsItems} />
            <NavMenuGroup title="Planning" items={planningItems} />
            <NavMenuGroup title="System" items={systemItems} />
          </NavigationMenuList>
        </NavigationMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-sm p-1 pr-2 transition-colors hover:bg-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:bg-foreground/10">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                JD
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm text-muted-foreground sm:inline-block">
              John Doe
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground">
                  john.doe@cargo.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

