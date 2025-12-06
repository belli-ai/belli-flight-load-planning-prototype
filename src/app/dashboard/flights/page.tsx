import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";

export default function FlightsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Flight Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Manage departures, arrivals, and flight operations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="size-4 text-primary" />
            Flight Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Flight schedule management coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

