import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileSpreadsheet,
  ArrowRight,
  Layers,
  Zap,
  Eye,
  Download,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: FileSpreadsheet,
    title: "Excel Upload",
    description: "Drag & drop Excel files with instant validation and preview",
  },
  {
    icon: Layers,
    title: "Dynamic Mapping",
    description: "Interactive column mapping with drag-and-drop interface",
  },
  {
    icon: Zap,
    title: "Rule-Based Transform",
    description: "Configure conditional logic for Equipment, Assembly, Spare rows",
  },
  {
    icon: Eye,
    title: "Real-Time Preview",
    description: "See transformations instantly before exporting",
  },
  {
    icon: Sparkles,
    title: "AI Suggestions",
    description: "Smart column mapping recommendations powered by AI",
  },
  {
    icon: Download,
    title: "Export Ready",
    description: "Generate processed Excel files with one tap",
  },
];

const benefits = [
  "No more manual Excel transformations",
  "Save hours on repetitive data work",
  "Reduce errors with rule-based logic",
  "Works offline on any device",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border safe-top">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">ASPIRANT</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Excel Transformation Made Simple
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Transform Excel Data{" "}
              <span className="text-gradient">Effortlessly</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Upload, map, and transform complex Excel files with powerful
              rule-based logic. Built for mobile, designed for productivity.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="min-h-[52px] text-base" asChild>
                <Link to="/register">
                  Start Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-[52px] text-base"
                asChild
              >
                <Link to="/login">Log in to your account</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </section>

      {/* Benefits */}
      <section className="border-y border-border bg-muted/30 py-8">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                <CheckCircle2 className="h-5 w-5 text-accent" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed for complex Excel transformations,
              accessible from any device.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group border-border/50 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="container">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-8 text-center sm:p-12">
              <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
                Ready to Transform Your Workflow?
              </h2>
              <p className="mb-8 text-muted-foreground">
                Join thousands of professionals who save hours every week with
                ASPIRANT.
              </p>
              <Button size="lg" className="min-h-[52px] text-base" asChild>
                <Link to="/register">
                  Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 safe-bottom">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FileSpreadsheet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">ASPIRANT</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ASPIRANT. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
