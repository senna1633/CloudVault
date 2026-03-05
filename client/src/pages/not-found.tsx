import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-secondary border-border">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="h-7 w-7 text-destructive shrink-0 mt-0.5" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">404 - Page Not Found</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                The page you are looking for does not exist or has been moved.
              </p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="mt-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
