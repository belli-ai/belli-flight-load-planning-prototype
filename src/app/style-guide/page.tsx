import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <svg className="size-5 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Lufthansa Cargo
              </h1>
              <p className="text-muted-foreground">
                Load Planning Design System
              </p>
            </div>
          </div>
        </header>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Typography
          </h2>
          <div className="space-y-3">
            <p className="text-3xl font-bold">Heading 1 — Inter Bold</p>
            <p className="text-2xl font-semibold">
              Heading 2 — Inter Semibold
            </p>
            <p className="text-xl font-medium">Heading 3 — Inter Medium</p>
            <p className="text-base">Body Text — Inter Regular</p>
            <p className="text-sm text-muted-foreground">
              Small/Muted — Inter Regular
            </p>
            <code className="text-sm bg-muted px-2 py-1 rounded-sm font-mono">
              Inline Code — monospace
            </code>
          </div>
        </section>

        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch name="Background" className="bg-background" />
            <ColorSwatch name="Foreground" className="bg-foreground" />
            <ColorSwatch name="Primary" className="bg-primary" />
            <ColorSwatch name="Secondary" className="bg-secondary" />
            <ColorSwatch name="Accent" className="bg-accent" />
            <ColorSwatch name="Muted" className="bg-muted" />
            <ColorSwatch name="Card" className="bg-card" />
            <ColorSwatch name="Destructive" className="bg-destructive" />
          </div>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                Lufthansa Blue (Primary)
              </h3>
              <div className="flex gap-1">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                  (shade) => (
                    <div
                      key={shade}
                      className="h-12 flex-1 rounded-sm"
                      style={{
                        backgroundColor: `var(--color-lh-blue-${shade})`,
                      }}
                      title={`LH Blue ${shade}`}
                    />
                  )
                )}
              </div>
              <div className="flex gap-1 mt-1 text-xs text-muted-foreground">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                  (shade) => (
                    <div key={shade} className="flex-1 text-center">
                      {shade}
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                Lufthansa Yellow (Accent)
              </h3>
              <div className="flex gap-1">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                  (shade) => (
                    <div
                      key={shade}
                      className="h-12 flex-1 rounded-sm"
                      style={{
                        backgroundColor: `var(--color-lh-yellow-${shade})`,
                      }}
                      title={`LH Yellow ${shade}`}
                    />
                  )
                )}
              </div>
              <div className="flex gap-1 mt-1 text-xs text-muted-foreground">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                  (shade) => (
                    <div key={shade} className="flex-1 text-center">
                      {shade}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Border Radius */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Border Radius (xs = 0.25rem)
          </h2>
          <div className="flex gap-4 items-end">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 bg-primary rounded-sm" />
              <span className="text-xs text-muted-foreground">sm</span>
            </div>
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 bg-primary rounded-md" />
              <span className="text-xs text-muted-foreground">md</span>
            </div>
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 bg-primary rounded-lg" />
              <span className="text-xs text-muted-foreground">lg</span>
            </div>
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 bg-primary rounded-xl" />
              <span className="text-xs text-muted-foreground">xl</span>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">+</Button>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Cards
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Flight Information</CardTitle>
                <CardDescription>
                  Basic card with header and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Flight BA-2847 departing from LHR to JFK. Estimated cargo
                  capacity: 15,000 kg.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">View Details</Button>
              </CardFooter>
            </Card>
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-primary">Highlighted Card</CardTitle>
                <CardDescription>Card with accent border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Important information that needs attention.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Form Elements */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Form Elements
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="flight">Flight Number</Label>
              <Input id="flight" placeholder="e.g., BA-2847" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Cargo Weight (kg)</Label>
              <Input id="weight" type="number" placeholder="0" />
            </div>
          </div>
        </section>

        {/* Tables */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Tables
          </h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ULD Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">AKE12345BA</TableCell>
                  <TableCell>LD3</TableCell>
                  <TableCell>1,250</TableCell>
                  <TableCell className="text-right">11L</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">AKE12346BA</TableCell>
                  <TableCell>LD3</TableCell>
                  <TableCell>980</TableCell>
                  <TableCell className="text-right">12L</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">PMC78901BA</TableCell>
                  <TableCell>P1P</TableCell>
                  <TableCell>4,500</TableCell>
                  <TableCell className="text-right">21P</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          Lufthansa Cargo Load Planning — Design System v1.0
        </footer>
      </div>
    </div>
  );
}

function ColorSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-16 rounded-sm border border-border ${className}`} />
      <p className="text-xs text-muted-foreground">{name}</p>
    </div>
  );
}
