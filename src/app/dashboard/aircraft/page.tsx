import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";

export default function AircraftPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Aircraft Config</h1>
        <p className="text-sm text-muted-foreground">
          Manage aircraft types, deck configurations, and loading positions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="size-4 text-primary" />
            Aircraft Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Aircraft configuration interface coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

