"use client";

import { useState, useEffect, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";

// Mock data for dashboard statistics
const heroStats = [
  {
    value: "12",
    label: "Flights Today",
    description: "Active flight operations",
    icon: Plane,
    color: "text-foreground",
    bgGlow: "from-primary/20 via-transparent to-transparent",
  },
  {
    value: "48",
    label: "Pending Cargo",
    description: "Shipments awaiting processing",
    icon: Package,
    color: "text-foreground",
    bgGlow: "from-blue-500/20 via-transparent to-transparent",
  },
  {
    value: "8",
    label: "Active Load Plans",
    description: "Currently being optimized",
    icon: Scale,
    color: "text-foreground",
    bgGlow: "from-emerald-500/20 via-transparent to-transparent",
  },
  {
    value: "99.2%",
    label: "On-Time Rate",
    description: "Performance metric - Live",
    icon: TrendingUp,
    color: "text-primary",
    bgGlow: "from-primary/30 via-primary/10 to-transparent",
    isLive: true,
  },
];

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
    title: "Packing Rules",
    description: "Cargo constraints & policies",
    href: "/dashboard/packing-rules",
    icon: <BookOpen className="size-5" />,
    stat: "Manage rules",
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const goToNext = useCallback(() => {
    setDirection("right");
    setCurrentIndex((prev) => (prev + 1) % heroStats.length);
  }, []);

  const goToPrev = useCallback(() => {
    setDirection("left");
    setCurrentIndex((prev) => (prev - 1 + heroStats.length) % heroStats.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentIndex ? "right" : "left");
    setCurrentIndex(index);
  }, [currentIndex]);

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext]);

  const currentStat = heroStats[currentIndex];
  const IconComponent = currentStat.icon;

  return (
    <div className="relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        {/* Hero Statistics Carousel */}
        <section className="mb-16">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Real-time overview of cargo operations
            </p>
          </div>

          {/* Hero Carousel */}
          <div 
            className="relative overflow-hidden rounded-lg border bg-card"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Ambient glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${currentStat.bgGlow} transition-all duration-700`} />
            
            <div className="relative px-8 py-12 md:px-16 md:py-20">
              {/* Top bar with navigation */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <IconComponent className="size-4" />
                  </div>
                  {currentStat.isLive && (
                    <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                
                {/* Navigation arrows */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrev}
                    className="flex h-8 w-8 items-center justify-center rounded-md border bg-background/80 backdrop-blur-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    aria-label="Previous stat"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="flex h-8 w-8 items-center justify-center rounded-md border bg-background/80 backdrop-blur-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    aria-label="Next stat"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Main content */}
              <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
                <div
                  key={currentIndex}
                  className="animate-in fade-in slide-in-from-right-4 duration-500"
                  style={{
                    animationName: direction === "right" 
                      ? "fadeInSlideRight" 
                      : "fadeInSlideLeft"
                  }}
                >
                  <p className={`text-7xl font-bold tracking-tighter md:text-9xl ${currentStat.color}`}>
                    {currentStat.value}
                  </p>
                  <p className="mt-2 text-xl font-medium text-foreground md:text-2xl">
                    {currentStat.label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentStat.description}
                  </p>
                </div>
              </div>

              {/* Dot indicators */}
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {heroStats.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? "w-6 bg-primary" 
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`Go to stat ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick stat pills below carousel */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {heroStats.map((stat, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  index === currentIndex
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <stat.icon className="size-3.5" />
                <span className="font-medium">{stat.value}</span>
                <span className="hidden sm:inline">{stat.label}</span>
              </button>
            ))}
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

