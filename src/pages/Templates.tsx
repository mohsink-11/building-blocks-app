import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileSpreadsheet,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Copy,
  Pencil,
  Download,
  Upload,
  Play,
} from "lucide-react";

import { readTemplatesFromStorage } from "@/lib/templates"

const categories = ["All", "BOM", "Inventory", "Parts", "Custom"];

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [allTemplates, setAllTemplates] = useState(() => readTemplatesFromStorage());

  const persist = (next: typeof allTemplates) => {
    setAllTemplates(next);
    try {
      localStorage.setItem('templates_v1', JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const navigate = useNavigate();
  const importRef = useRef<HTMLInputElement | null>(null);

  const handleUse = (id: string) => {
    // Navigate to mapping screen with template id set as query param
    navigate(`/mapping/new?template=${id}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this template?')) return;
    persist(allTemplates.filter((t) => t.id !== id));
  };

  const handleDuplicate = (id: string) => {
    const src = allTemplates.find((t) => t.id === id);
    if (!src) return;
    const copy = { ...src, id: Math.random().toString(36).slice(2, 9), name: `${src.name} (copy)` };
    persist([copy, ...allTemplates]);
  };

  const handleExport = (id: string) => {
    const tmpl = allTemplates.find((t) => t.id === id);
    if (!tmpl) return;
    const blob = new Blob([JSON.stringify(tmpl, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tmpl.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEdit = (id: string) => {
    const tmpl = allTemplates.find((t) => t.id === id);
    if (!tmpl) return;
    const newName = prompt('Template name', tmpl.name);
    if (newName && newName.trim()) {
      persist(allTemplates.map((t) => (t.id === id ? { ...t, name: newName } : t)));
    }
  };

  const handleImportClick = () => importRef.current?.click();
  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        const imported = { ...obj, id: Math.random().toString(36).slice(2, 9) };
        persist([imported, ...allTemplates]);
      } catch (err) {
        alert('Invalid template file');
      }
    };
    reader.readAsText(f);
    e.currentTarget.value = '';
  };

  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Templates</h1>
          <p className="text-muted-foreground">
            Reusable transformation configurations
          </p>
        </div>
        <div className="flex gap-3">
          <input ref={importRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => {
            const id = Math.random().toString(36).slice(2,9);
            persist([{ id, name: 'New Template', description: '', category: 'Custom', usageCount: 0, lastUsed: 'never' }, ...allTemplates]);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => handleUse(template.id)}>
                        <Play className="mr-2 h-4 w-4" />
                        Use Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(template.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(template.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(template.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold mb-2">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{template.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Used {template.usageCount} times
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No templates found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Create your first template to get started"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
