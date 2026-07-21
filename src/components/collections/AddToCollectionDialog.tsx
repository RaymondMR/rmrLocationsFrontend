import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";
import type { LocationCollection } from "@/types/models";

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: LocationCollection[];
  locationId: string;
  locationName: string;
  existingCollectionIds: string[];
  onAdd: (collectionId: string) => void;
  onCreateNew: () => void;
  isAdding?: boolean;
}

export default function AddToCollectionDialog({
  open,
  onOpenChange,
  collections,
  locationName,
  existingCollectionIds,
  onAdd,
  onCreateNew,
  isAdding,
}: AddToCollectionDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Guardar en colección"
      description={`"${locationName}"`}
    >
      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
        {collections.map((col) => {
          const alreadyIn = existingCollectionIds.includes(col.id);
          return (
            <button
              key={col.id}
              disabled={alreadyIn || isAdding}
              onClick={() => onAdd(col.id)}
              className="flex items-center justify-between p-3 rounded-lg text-left transition-colors disabled:opacity-50"
              style={{
                background: alreadyIn ? "var(--success)" + "12" : "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--ink)",
                cursor: alreadyIn ? "default" : "pointer",
              }}
            >
              <div>
                <div className="font-medium text-sm">{col.name}</div>
                <div
                  className="text-xs"
                  style={{ fontFamily: "var(--mono)", color: "var(--ink-muted)" }}
                >
                  {col.items?.length ?? 0} lugares
                </div>
              </div>
              {alreadyIn ? (
                <span className="text-xs flex items-center gap-1" style={{ color: "var(--success)" }}>
                  <Check size={14} /> Ya guardado
                </span>
              ) : (
                <Plus size={16} style={{ color: "var(--primary)" }} />
              )}
            </button>
          );
        })}

        <Button variant="secondary" onClick={onCreateNew} className="mt-2">
          <Plus size={14} /> Crear nueva colección
        </Button>
      </div>
    </Dialog>
  );
}
