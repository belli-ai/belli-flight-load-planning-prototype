import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Package,
  Scale,
  Boxes,
  Database,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

// Mock data for dashboard statistics
const stats = {
  flightsToday: 12,
  pendingCargo: 48,
  activeLoadPlans: 8,
  onTimeRate: 99.2,
};

// Mock data for major features with urgency stats
const majorFeatures = [
  {
    title: "Flight Schedule",
    description: "Manage departures, arrivals, and flight operations",
    href: "/dashboard/flights",
    icon: <Plane className="size-6" />,
    stat: "12 flights today",
    urgency: "3 departing within 2 hours",
    urgencyLevel: "warning" as const,
  },
  {
    title: "Build Up",
    description: "ULD packing, container build-up, and cargo assignment",
    href: "/dashboard/build-up",
    icon: <Boxes className="size-6" />,
    stat: "24 ULDs in progress",
    urgency: "5 awaiting assignment",
    urgencyLevel: "info" as const,
  },
  {
    title: "Load Balancing",
    description: "Weight distribution, CG calculations, and trim optimization",
    href: "/dashboard/load-balancing",
    icon: <Scale className="size-6" />,
    stat: "8 active plans",
    urgency: "2 require attention",
    urgencyLevel: "warning" as const,
  },
];

// Mock data for pending flights
const pendingFlights = [
  {
    id: "FL-2847",
    flightNumber: "GA-847",
    route: "CGK → SIN",
    departure: "14:30",
    status: "Build Up",
    timeLeft: "1h 45m",
  },
  {
    id: "FL-1293",
    flightNumber: "GA-293",
    route: "CGK → HKG",
    departure: "15:15",
    status: "Pending",
    timeLeft: "2h 30m",
  },
  {
    id: "FL-0512",
    flightNumber: "GA-512",
    route: "CGK → NRT",
    departure: "16:00",
    status: "Pending",
    timeLeft: "3h 15m",
  },
];

// Secondary features
const secondaryFeatures = [
  {
    title: "Aircraft Config",
    description: "Aircraft types and positions",
    href: "/dashboard/aircraft",
    icon: <Plane className="size-5" />,
    stat: "15 aircraft types",
  },
  {
    title: "Cargo Management",
    description: "AWBs and shipment tracking",
    href: "/dashboard/cargo",
    icon: <Package className="size-5" />,
    stat: "48 pending items",
  },
  {
    title: "Reference Data",
    description: "Locations and settings",
    href: "/dashboard/reference-data",
    icon: <Database className="size-5" />,
    stat: "System config",
  },
];

export default function DashboardPage() {
  return (
    <div className="relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        {/* Hero Statistics */}
        <section className="mb-12">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Real-time overview of cargo operations
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Flights Today"
              value={stats.flightsToday.toString()}
              icon={<Plane className="size-4" />}
            />
            <StatCard
              label="Pending Cargo"
              value={stats.pendingCargo.toString()}
              icon={<Package className="size-4" />}
            />
            <StatCard
              label="Active Load Plans"
              value={stats.activeLoadPlans.toString()}
              icon={<Scale className="size-4" />}
            />
            <StatCard
              label="On-Time Rate"
              value={`${stats.onTimeRate}%`}
              icon={<TrendingUp className="size-4" />}
              highlight
            />
          </div>
        </section>

        {/* Major Feature Cards */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {majorFeatures.map((feature) => (
              <MajorFeatureCard key={feature.href} {...feature} />
            ))}
          </div>
        </section>

        {/* Pending Flights Quick Actions */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming Departures</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/flights">
                View all
                <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {pendingFlights.map((flight) => (
                  <PendingFlightRow key={flight.id} {...flight} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Secondary Features Grid */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">More Features</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {secondaryFeatures.map((feature) => (
              <SecondaryFeatureCard key={feature.href} {...feature} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{icon}</span>
          {highlight && (
            <span className="text-xs text-primary font-medium">LIVE</span>
          )}
        </div>
        <div className="mt-3">
          <p
            className={`text-3xl font-bold tracking-tight ${highlight ? "text-primary" : ""}`}
          >
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MajorFeatureCard({
  title,
  description,
  href,
  icon,
  stat,
  urgency,
  urgencyLevel,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  stat: string;
  urgency: string;
  urgencyLevel: "warning" | "info";
}) {
  return (
    <Link href={href}>
      <Card className="group h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              {icon}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">{stat.split(" ")[0]}</p>
              <p className="text-xs text-muted-foreground">
                {stat.split(" ").slice(1).join(" ")}
              </p>
            </div>
          </div>
          <CardTitle className="mt-4 text-lg">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs ${
              urgencyLevel === "warning"
                ? "bg-orange-500/10 text-orange-500"
                : "bg-primary/10 text-primary"
            }`}
          >
            {urgencyLevel === "warning" ? (
              <AlertTriangle className="size-3" />
            ) : (
              <Clock className="size-3" />
            )}
            {urgency}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PendingFlightRow({
  id,
  flightNumber,
  route,
  departure,
  status,
  timeLeft,
}: {
  id: string;
  flightNumber: string;
  route: string;
  departure: string;
  status: string;
  timeLeft: string;
}) {
  return (
    <Link
      href={`/dashboard/build-up?flight=${id}`}
      className="flex items-center justify-between p-4 transition-colors hover:bg-foreground/10 focus:bg-foreground/10"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <Plane className="size-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{flightNumber}</span>
            <span className="text-xs text-muted-foreground">{route}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>Departs {departure}</span>
            <span className="text-primary">• {timeLeft} left</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded-sm px-2 py-1 text-xs ${
            status === "Build Up"
              ? "bg-orange-500/10 text-orange-500"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {status}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

function SecondaryFeatureCard({
  title,
  description,
  href,
  icon,
  stat,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  stat: string;
}) {
  return (
    <Link href={href}>
      <Card className="group h-full cursor-pointer transition-colors hover:border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              {icon}
            </div>
            <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{stat}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

