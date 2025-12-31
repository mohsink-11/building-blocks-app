import { useState } from "react";
import { GripVertical, X, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SourceColumn } from "./SourceColumnItem";

export interface TargetColumn {
  id: string;
  name: string;
  mappedColumns: string[];
  delimiter?: string;
  staticValue?: string;
}

interface TargetColumnItemProps {
  column: TargetColumn;
  sourceColumns: SourceColumn[];
  isDropTarget: boolean;
  onRemoveMapping: (sourceId: string) => void;
  onAddMapping: (sourceId: string) => void;
  onUpdateColumn: (updates: Partial<TargetColumn>) => void;
  onDelete: () => void;
  availableSourceColumns: SourceColumn[];
}

export function TargetColumnItem({
  column,
  sourceColumns,
  isDropTarget,
  onRemoveMapping,
  onAddMapping,
  onUpdateColumn,
  onDelete,
  availableSourceColumns,
}: TargetColumnItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);

  const handleNameSave = () => {
    onUpdateColumn({ name: editName });
    setIsEditing(false);
  };

  const getMappedSourceColumns = () => {
    return column.mappedColumns
      .map((id) => sourceColumns.find((s) => s.id === id))
      .filter(Boolean) as SourceColumn[];
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all",
        isDropTarget && "border-primary bg-primary/5 ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-start gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0 mt-1" />
        
        <div className="flex-1 min-w-0">
          {/* Column Name */}
          <div className="flex items-center gap-2 mb-3">
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                className="h-8 w-full max-w-[200px]"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="font-medium text-left hover:underline"
              >
                {column.name}
              </button>
            )}

            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Delimiter</label>
                    <Select
                      value={column.delimiter || " - "}
                      onValueChange={(v) => onUpdateColumn({ delimiter: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" - ">Dash ( - )</SelectItem>
                        <SelectItem value=", ">Comma (, )</SelectItem>
                        <SelectItem value=" | ">Pipe ( | )</SelectItem>
                        <SelectItem value=" ">Space</SelectItem>
                        <SelectItem value="">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Static Value</label>
                    <Input
                      value={column.staticValue || ""}
                      onChange={(e) => onUpdateColumn({ staticValue: e.target.value })}
                      placeholder="Optional prefix/suffix..."
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={onDelete}
                  >
                    Delete Column
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Mapped Source Columns */}
          <div className="flex flex-wrap gap-1.5">
            {getMappedSourceColumns().map((source) => (
              <Badge
                key={source.id}
                variant="secondary"
                className="gap-1 pr-1 bg-accent/10 text-accent border-accent/20"
              >
                {source.name}
                <button
                  onClick={() => onRemoveMapping(source.id)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-accent/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {column.staticValue && (
              <Badge variant="outline" className="text-xs">
                + "{column.staticValue}"
              </Badge>
            )}

            {/* Add Mapping Button */}
            {availableSourceColumns.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {availableSourceColumns.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => onAddMapping(source.id)}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                      >
                        {source.name}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {column.mappedColumns.length === 0 && !column.staticValue && (
              <span className="text-xs text-muted-foreground italic">
                Drop source columns here
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
