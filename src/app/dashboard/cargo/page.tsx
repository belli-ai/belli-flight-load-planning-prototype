import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function CargoPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Cargo Management</h1>
        <p className="text-sm text-muted-foreground">
          Track Air Waybills, parcel groups, and cargo items
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4 text-primary" />
            Cargo Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Cargo management interface coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

