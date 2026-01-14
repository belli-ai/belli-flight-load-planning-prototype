import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32">
          <div className="text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Lufthansa Cargo Load Management
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Lufthansa Cargo{" "}
              <span className="text-accent">Load Planning</span>
            </h1>

            {/* Description */}
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Professional cargo operations with intelligent weight & balance
              calculations, ULD management, and real-time load optimization.
            </p>
            
            {/* CTAs */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/style-guide">View Style Guide</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Weight & Balance"
            description="Precise CG calculations with real-time envelope monitoring and automatic trim optimization."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
                />
              </svg>
            }
          />
          <FeatureCard
            title="ULD Management"
            description="Track and manage Unit Load Devices with position mapping and weight distribution."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            }
          />
          <FeatureCard
            title="Load Sheets"
            description="Generate compliant load sheets and documentation for flight operations."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatItem value="99.9%" label="Calculation Accuracy" />
            <StatItem value="<2s" label="Load Time" />
            <StatItem value="24/7" label="System Availability" />
            <StatItem value="100+" label="Aircraft Types" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Lufthansa Cargo | Load Planning System</p>
          <p>v1.0.0</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-accent">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
