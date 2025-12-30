import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  BookOpen,
  Video,
  MessageCircle,
  Lightbulb,
  ExternalLink,
} from "lucide-react";

const faqs = [
  {
    question: "How do I upload an Excel file?",
    answer: "Navigate to the Upload page using the + button in the navigation. You can drag and drop your Excel file into the upload zone or click to browse your device. We support .xls and .xlsx files up to 50MB.",
  },
  {
    question: "What is column mapping?",
    answer: "Column mapping allows you to define how columns from your source Excel file should be transformed into your target output. You can map one or multiple source columns to a single target column, add static values, or create calculated fields.",
  },
  {
    question: "How do transformation rules work?",
    answer: "Transformation rules are conditional logic that determines how data is processed based on row types (Equipment, Assembly, Spare). You can set up different transformations for each type, including cross-row references and static value injections.",
  },
  {
    question: "Can I save my mapping configurations?",
    answer: "Yes! After configuring your column mappings and transformation rules, you can save them as templates. Templates can be reused for similar files, saving you time on repetitive transformations.",
  },
  {
    question: "How do I export my transformed data?",
    answer: "After previewing your transformed data, click the Export button. You can choose between Excel (.xlsx) or CSV format. The exported file will be downloaded to your device.",
  },
  {
    question: "Does ASPIRANT work offline?",
    answer: "Yes, ASPIRANT is a Progressive Web App (PWA) that works offline. You can install it on your device and access previously loaded projects without an internet connection. Some features like AI suggestions require connectivity.",
  },
];

const guides = [
  { title: "Getting Started Guide", type: "article", duration: "5 min read" },
  { title: "Column Mapping Tutorial", type: "video", duration: "8 min" },
  { title: "Advanced Rules Configuration", type: "article", duration: "10 min read" },
  { title: "Using Templates Effectively", type: "video", duration: "6 min" },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Help & Support
          </h1>
          <p className="text-muted-foreground">
            Find answers to common questions or contact us for help
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 text-base"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="cursor-pointer transition-all hover:shadow-lg">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Documentation</h3>
              <p className="text-sm text-muted-foreground">Browse guides</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:shadow-lg">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground">Watch & learn</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:shadow-lg">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Contact Support</h3>
              <p className="text-sm text-muted-foreground">Get help</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  No results found for "{searchQuery}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guides Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Guides & Tutorials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {guides.map((guide, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {guide.type === "video" ? (
                        <Video className="h-5 w-5" />
                      ) : (
                        <BookOpen className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{guide.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {guide.duration}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What can we help you with?"
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question..."
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Feature Request */}
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Have a feature request?</h3>
              <p className="text-sm text-muted-foreground">
                We'd love to hear your ideas for improving ASPIRANT
              </p>
            </div>
            <Button variant="outline">Submit Idea</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
