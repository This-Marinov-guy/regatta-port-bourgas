"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/app/components/ui/button";
import type { AdminDocumentRecord } from "@/types/admin";

const interactiveButtonClass =
  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md";

type EventDocumentReferenceFieldProps = {
  label: string;
  values: string[];
  documents: AdminDocumentRecord[];
  onChange: (values: string[]) => void;
  onReorder?: (values: string[]) => void | Promise<void>;
  onError: (msg: string) => void;
  onDocumentsCreated: (docs: AdminDocumentRecord[]) => void;
  onDocumentUpdated: (doc: AdminDocumentRecord) => void;
  onCreateDocuments: (args: {
    files: File[];
    generalUse?: boolean;
  }) => Promise<AdminDocumentRecord[]>;
  onSaveDocument: (args: {
    id: string;
    name_en: string;
    name_bg: string;
    source: string;
    general_use: boolean;
  }) => Promise<AdminDocumentRecord>;
  allowSelectExistingDocuments?: boolean;
};

function reorderStringValues(
  values: string[],
  fromIndex: number,
  toIndex: number,
) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex === toIndex ||
    fromIndex >= values.length ||
    toIndex >= values.length
  ) {
    return values;
  }

  const next = [...values];
  const [moved] = next.splice(fromIndex, 1);

  if (!moved) {
    return values;
  }

  next.splice(toIndex, 0, moved);
  return next;
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function FileDropPanel({
  label,
  onFiles,
  multiple = false,
  uploading = false,
  helperText,
}: {
  label: string;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  uploading?: boolean;
  helperText?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    onFiles(Array.from(fileList));
  }

  return (
    <div>
      <span className="mb-2 block font-medium text-dark">{label}</span>
      <div
        onClick={() => {
          if (!uploading) {
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-[1.5rem] border-2 border-dashed px-5 py-6 transition-all ${
          dragging
            ? "border-primary bg-primary/5 shadow-lg"
            : "border-black/10 bg-white/80"
        } ${uploading ? "cursor-progress" : "cursor-pointer"}`}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon icon="ph:upload-simple-bold" width={22} height={22} />
          </div>
          <div>
            <p className="font-semibold text-dark">
              {uploading ? "Uploading files..." : "Upload files"}
            </p>
            <p className="mt-1 text-dark/60">
              {helperText ?? "Drag and drop files or click the input to start selecting."}
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function ExistingDocumentsMultiSelect({
  documents,
  values,
  onAdd,
}: {
  documents: AdminDocumentRecord[];
  values: string[];
  onAdd: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const reusableDocuments = documents.filter((item) => item.general_use);
  const availableDocuments = reusableDocuments.filter(
    (item) => !values.includes(item.id),
  );

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) =>
        availableDocuments.some((document) => document.id === id),
      ),
    );
  }, [availableDocuments]);

  function handleSelectionChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextValues = Array.from(event.target.selectedOptions, (option) => option.value);
    setSelectedIds(nextValues);
  }

  function handleAddSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    onAdd(selectedIds);
    setSelectedIds([]);
    setOpen(false);
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
      >
        <span>Add existing documents</span>
        <Icon
          icon={open ? "ph:caret-up-bold" : "ph:caret-down-bold"}
          width={14}
          height={14}
        />
      </button>

      {open ? (
        <div className="mt-3 rounded-[1.25rem] border border-black/10 bg-white/85 p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-semibold text-dark">Existing documents</p>
              <p className="mt-1 text-sm text-dark/60">
                Select one or more reusable documents to attach.
              </p>
            </div>

            {reusableDocuments.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-black/15 bg-white/80 px-4 py-6 text-sm text-dark/60">
                No general-use documents in the library yet.
              </div>
            ) : availableDocuments.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-black/15 bg-white/80 px-4 py-6 text-sm text-dark/60">
                All general-use documents are already attached.
              </div>
            ) : (
              <div className="grid gap-3">
                <select
                  multiple
                  value={selectedIds}
                  onChange={handleSelectionChange}
                  className="min-h-40 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                >
                  {availableDocuments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name_en}
                      {item.name_bg ? ` / ${item.name_bg}` : ""}
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-dark/55">
                    Hold Cmd/Ctrl to select multiple documents.
                  </p>
                  <Button
                    type="button"
                    onClick={handleAddSelected}
                    disabled={selectedIds.length === 0}
                    className={`rounded-xl px-4 text-white ${interactiveButtonClass}`}
                  >
                    Attach selected
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function addUniqueValues(values: string[], ids: string[]) {
  return [
    ...values,
    ...ids.filter((id) => !values.includes(id)),
  ];
}

function addExistingDocumentDetails(
  documents: AdminDocumentRecord[],
  ids: string[],
) {
  return ids
    .map((id) => documents.find((item) => item.id === id))
    .filter((item): item is AdminDocumentRecord => Boolean(item));
}

function ExistingDocumentsSummary({
  documents,
}: {
  documents: AdminDocumentRecord[];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {documents.map((item) => (
        <div
          key={item.id}
          className="inline-flex max-w-full items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800"
        >
          <span className="truncate font-medium">{item.name_en}</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">
            General use
          </span>
        </div>
      ))}
    </div>
  );
}

function InlineAdminField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-dark">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function EventAttachedDocumentCard({
  document,
  onRemove,
  onError,
  onUpdated,
  onDragStart,
  onDragEnd,
  onSaveDocument,
  isDragging = false,
}: {
  document: AdminDocumentRecord;
  onRemove: () => void;
  onError: (msg: string) => void;
  onUpdated: (doc: AdminDocumentRecord) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onSaveDocument: EventDocumentReferenceFieldProps["onSaveDocument"];
  isDragging?: boolean;
}) {
  const [nameEn, setNameEn] = useState(document.name_en);
  const [nameBg, setNameBg] = useState(document.name_bg ?? "");
  const [generalUse, setGeneralUse] = useState(document.general_use);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNameEn(document.name_en);
    setNameBg(document.name_bg ?? "");
    setGeneralUse(document.general_use);
  }, [document.id, document.name_en, document.name_bg, document.general_use]);

  const dirty =
    nameEn !== document.name_en ||
    nameBg !== (document.name_bg ?? "") ||
    generalUse !== document.general_use;

  async function handleSave() {
    setSaving(true);

    try {
      const updated = await onSaveDocument({
        id: document.id,
        name_en: nameEn,
        name_bg: nameBg,
        source: document.source,
        general_use: generalUse,
      });

      onUpdated(updated);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Unable to update document.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`rounded-[1.25rem] border border-black/10 bg-white/90 p-4 shadow-sm transition-all ${
        isDragging ? "border-primary/30 bg-primary/[0.03] shadow-md" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon icon="ph:file-text-bold" width={20} height={20} />
        </div>
        <div className="min-w-0 flex-1">
          <a
            href={document.source}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-semibold text-primary hover:underline"
          >
            Click to open
          </a>
          <p className="mt-1 text-sm text-dark/50">
            Uploaded {formatTimestamp(document.updated_at)}
          </p>
        </div>
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="inline-flex cursor-grab items-center gap-2 rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm font-medium text-dark/70 active:cursor-grabbing"
          aria-label={`Drag to reorder ${document.name_en}`}
          title="Drag to reorder"
        >
          <Icon icon="ph:dots-six-vertical-bold" width={16} height={16} />
          Move
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <InlineAdminField
          label="Name (EN)"
          value={nameEn}
          onChange={setNameEn}
          required
        />
        <InlineAdminField
          label="Name (BG, optional)"
          value={nameBg}
          onChange={setNameBg}
        />
        <label className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark">
          <input
            type="checkbox"
            checked={generalUse}
            onChange={(event) => setGeneralUse(event.target.checked)}
            className="h-4 w-4 rounded border-black/20 text-primary focus:ring-primary"
          />
          <div>
            <p className="font-medium">General use document</p>
            <p className="text-sm text-dark/60">
              Make this reusable outside this event too.
            </p>
          </div>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !dirty || !nameEn.trim()}
          className="rounded-xl px-4 text-white"
        >
          {saving ? "Saving..." : "Apply"}
        </Button>
        <button
          type="button"
          onClick={onRemove}
          className="font-semibold text-red-500 hover:underline"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function EventDocumentReferenceField({
  label,
  values,
  documents,
  onChange,
  onReorder,
  onError,
  onDocumentsCreated,
  onDocumentUpdated,
  onCreateDocuments,
  onSaveDocument,
  allowSelectExistingDocuments = false,
}: EventDocumentReferenceFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedValue, setDraggedValue] = useState<string | null>(null);
  const [dragOverValue, setDragOverValue] = useState<string | null>(null);

  const documentsById = new Map(documents.map((item) => [item.id, item]));
  const attachedReusableDocuments = values
    .map((value) => documentsById.get(value))
    .filter(
      (item): item is AdminDocumentRecord => Boolean(item?.general_use),
    );

  async function handleFiles(files: File[]) {
    setUploading(true);

    try {
      const createdDocs = await onCreateDocuments({
        files,
        generalUse: false,
      });
      onDocumentsCreated(createdDocs);
      onChange([
        ...values,
        ...createdDocs
          .map((item) => item.id)
          .filter((id) => !values.includes(id)),
      ]);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function addExisting(ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    const selectedDocuments = addExistingDocumentDetails(documents, ids);
    if (selectedDocuments.length === 0) {
      return;
    }

    onChange(addUniqueValues(values, selectedDocuments.map((item) => item.id)));
  }

  function remove(index: number) {
    onChange(values.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleDragStart(value: string) {
    setDraggedValue(value);
    setDragOverValue(value);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, value: string) {
    if (!draggedValue) {
      return;
    }

    event.preventDefault();

    if (dragOverValue !== value) {
      setDragOverValue(value);
    }
  }

  function handleDrop(value: string) {
    if (!draggedValue) {
      return;
    }

    const fromIndex = values.indexOf(draggedValue);
    const toIndex = values.indexOf(value);
    const next = reorderStringValues(values, fromIndex, toIndex);

    if (next !== values) {
      onChange(next);
      void onReorder?.(next);
    }

    setDraggedValue(null);
    setDragOverValue(null);
  }

  function handleDragEnd() {
    setDraggedValue(null);
    setDragOverValue(null);
  }

  return (
    <div>
      <FileDropPanel
        label={label}
        multiple
        uploading={uploading}
        onFiles={handleFiles}
        helperText="Drop files here to create document records and attach them to this event."
      />

      {allowSelectExistingDocuments ? (
        <ExistingDocumentsMultiSelect
          documents={documents}
          values={values}
          onAdd={addExisting}
        />
      ) : null}

      {allowSelectExistingDocuments && attachedReusableDocuments.length > 0 ? (
        <ExistingDocumentsSummary documents={attachedReusableDocuments} />
      ) : null}

      {values.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {values.map((value, index) => {
            const document = documentsById.get(value);

            if (document) {
              return (
                <div
                  key={`${value}-${index}`}
                  onDragOver={(event) => handleDragOver(event, value)}
                  onDrop={() => handleDrop(value)}
                  className={`rounded-[1.35rem] transition-all ${
                    dragOverValue === value && draggedValue !== value
                      ? "ring-2 ring-primary/40 ring-offset-2"
                      : ""
                  } ${draggedValue === value ? "opacity-80" : ""}`}
                >
                  <EventAttachedDocumentCard
                    document={document}
                    onRemove={() => remove(index)}
                    onError={onError}
                    onUpdated={onDocumentUpdated}
                    onDragStart={() => handleDragStart(value)}
                    onDragEnd={handleDragEnd}
                    onSaveDocument={onSaveDocument}
                    isDragging={draggedValue === value}
                  />
                </div>
              );
            }

            return (
              <div
                key={`${value}-${index}`}
                className="rounded-[1.25rem] border border-amber-200 bg-amber-50/70 p-4 shadow-sm"
              >
                <p className="font-semibold text-amber-800">
                  Legacy file reference
                </p>
                <p className="mt-1 break-all text-sm text-amber-700">{value}</p>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-3 font-semibold text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
