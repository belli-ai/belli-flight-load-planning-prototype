import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

export default function LoadBalancingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Load Balancing</h1>
        <p className="text-sm text-muted-foreground">
          Weight distribution, CG calculations, and trim optimization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="size-4 text-primary" />
            Weight & Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Weight & balance interface coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

