import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes } from "lucide-react";

export default function BuildUpPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Build Up</h1>
        <p className="text-sm text-muted-foreground">
          ULD packing, container build-up, and cargo assignment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="size-4 text-primary" />
            ULD Build Up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              ULD build up interface coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

