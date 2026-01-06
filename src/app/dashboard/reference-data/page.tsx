import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function ReferenceDataPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Reference Data</h1>
        <p className="text-sm text-muted-foreground">
          Manage locations, commodity codes, DG classes, and system settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-primary" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Reference data management coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}






