import { Navbar } from "@/components/shared/navbar";
import { FlightProvider } from "@/components/shared/flight-selector";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FlightProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>{children}</main>
      </div>
    </FlightProvider>
  );
}
