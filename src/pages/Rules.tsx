import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Settings2,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Placeholder rules configuration
const baseTypes = [
  { id: "equipment", label: "Equipment", color: "bg-blue-500" },
  { id: "assembly", label: "Assembly", color: "bg-amber-500" },
  { id: "spare", label: "Spare", color: "bg-emerald-500" },
];

export default function Rules() {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedBaseType, setSelectedBaseType] = useState("equipment");
  const [rules, setRules] = useState([
    {
      id: "r1",
      name: "Parent Reference",
      type: "cross_row",
      enabled: true,
      valid: true,
    },
    {
      id: "r2",
      name: "Static Category",
      type: "static_value",
      enabled: true,
      valid: true,
    },
    {
      id: "r3",
      name: "Quantity Multiplier",
      type: "calculation",
      enabled: false,
      valid: false,
    },
  ]);

  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link to={`/mapping/${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Mapping
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Transformation Rules
            </h1>
            <p className="text-muted-foreground">
              Configure conditional logic for each row type
            </p>
          </div>
          <Button asChild>
            <Link to={`/preview/${projectId}`}>
              Preview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Base Type Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Base Row Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {baseTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedBaseType(type.id)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  selectedBaseType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className={`h-4 w-4 rounded-full ${type.color}`} />
                <span className="font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rules Configuration */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rules for {baseTypes.find((t) => t.id === selectedBaseType)?.label}</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {rules.map((rule) => (
              <AccordionItem key={rule.id} value={rule.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => {
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id ? { ...r, enabled: checked } : r
                          )
                        );
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={rule.enabled ? "" : "text-muted-foreground"}>
                      {rule.name}
                    </span>
                    {rule.valid ? (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Rule Type</Label>
                        <Select defaultValue={rule.type}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cross_row">Cross-Row Reference</SelectItem>
                            <SelectItem value="static_value">Static Value</SelectItem>
                            <SelectItem value="calculation">Calculation</SelectItem>
                            <SelectItem value="conditional">Conditional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Target Column</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="part_id">Part ID</SelectItem>
                            <SelectItem value="description">Description</SelectItem>
                            <SelectItem value="quantity">Quantity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {rule.type === "static_value" && (
                      <div className="space-y-2">
                        <Label>Static Value</Label>
                        <Input placeholder="Enter value to inject" />
                      </div>
                    )}

                    {rule.type === "cross_row" && (
                      <div className="space-y-2">
                        <Label>Source Row Relationship</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="parent">Parent Row</SelectItem>
                            <SelectItem value="previous">Previous Row</SelectItem>
                            <SelectItem value="first">First Row</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Rule
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Static Values */}
      <Card>
        <CardHeader>
          <CardTitle>Static Value Injections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Column</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="source">Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input placeholder="Static value" />
              </div>
              <div className="flex items-end">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
