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
  draftDocumentIds?: string[];
  onChange: (values: string[]) => void;
  onReorder?: (values: string[]) => void | Promise<void>;
  onError: (msg: string) => void;
  onDocumentsCreated: (docs: AdminDocumentRecord[]) => void;
  onDocumentUpdated: (doc: AdminDocumentRecord) => void;
  onDraftDocumentCreated?: (doc: AdminDocumentRecord) => void;
  onDraftDocumentUpdated?: (doc: AdminDocumentRecord) => void;
  onCreateDocuments: (args: {
    files: File[];
    generalUse?: boolean;
  }) => Promise<AdminDocumentRecord[]>;
  onCreateDocumentFromUrl: (args: {
    url: string;
    name?: string;
    nameBg?: string;
    generalUse?: boolean;
  }) => Promise<AdminDocumentRecord>;
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

function isValidDocumentUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function createDraftDocumentFromUrl(url: string): AdminDocumentRecord {
  const fallbackName = getDocumentNameFromUrl(url) || url;
  const timestamp = new Date().toISOString();

  return {
    id: `draft-link-${crypto.randomUUID()}`,
    name_en: fallbackName,
    name_bg: "",
    source: url,
    general_use: false,
    created_at: timestamp,
    updated_at: timestamp,
  };
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
    <div className="min-w-0">
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
        className={`min-w-0 rounded-[1.25rem] border-2 border-dashed px-4 py-5 transition-all sm:rounded-[1.5rem] sm:px-5 sm:py-6 ${
          dragging
            ? "border-primary bg-primary/5 shadow-lg"
            : "border-black/10 bg-white/80"
        } ${uploading ? "cursor-progress" : "cursor-pointer"}`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-12 sm:w-12">
            <Icon icon="ph:upload-simple-bold" width={22} height={22} />
          </div>
          <div className="min-w-0">
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

function LinkInputPanel({
  onSubmit,
  busy = false,
}: {
  onSubmit: (args: { url: string; name: string; nameBg: string }) => void;
  busy?: boolean;
}) {
  const [url, setUrl] = useState("");
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || busy || !isValidDocumentUrl(trimmedUrl)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onSubmitRef.current({
        url: trimmedUrl,
        name: "",
        nameBg: "",
      });
      setUrl("");
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [busy, url]);

  return (
    <div className="mt-3 min-w-0 rounded-[1.25rem] border border-black/10 bg-white/80 px-4 py-4 sm:rounded-[1.5rem] sm:px-5 sm:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-12 sm:w-12">
          <Icon icon="ph:link-bold" width={22} height={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-dark">Or paste a direct link</p>
          <p className="mt-1 text-dark/60">
            Paste a valid URL and a draft card will be added below.
          </p>

          <div className="mt-3 grid gap-2">
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/document.pdf"
              disabled={busy}
              className="block w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-black/5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getDocumentNameFromUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? parsed.hostname;
    const decoded = decodeURIComponent(last);
    const withoutExtension = decoded.replace(/\.[^.]+$/, "");
    const cleaned = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return cleaned || parsed.hostname;
  } catch {
    return "";
  }
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
    setSelectedIds((current) => {
      const filtered = current.filter((id) =>
        availableDocuments.some((document) => document.id === id),
      );
      return filtered.length === current.length ? current : filtered;
    });
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
                  className="block min-h-40 w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                >
                  {availableDocuments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name_en}
                      {item.name_bg ? ` / ${item.name_bg}` : ""}
                    </option>
                  ))}
                </select>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-dark/55">
                    Hold Cmd/Ctrl to select multiple documents.
                  </p>
                  <Button
                    type="button"
                    onClick={handleAddSelected}
                    disabled={selectedIds.length === 0}
                    className={`w-full rounded-xl px-4 text-white sm:w-auto ${interactiveButtonClass}`}
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

function prependUniqueValues(values: string[], ids: string[]) {
  return [...ids.filter((id) => !values.includes(id)), ...values];
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
          className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800"
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
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-dark">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="block w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function isInteractiveDragTarget(target: EventTarget | null) {
  if (
    target instanceof HTMLElement &&
    target.closest("[data-card-drag-handle]")
  ) {
    return false;
  }

  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("a, button, input, select, textarea"))
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
  onDraftDocumentUpdated,
  isDraft = false,
  isDragging = false,
}: {
  document: AdminDocumentRecord;
  onRemove: () => void;
  onError: (msg: string) => void;
  onUpdated: (doc: AdminDocumentRecord) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onSaveDocument: EventDocumentReferenceFieldProps["onSaveDocument"];
  onDraftDocumentUpdated?: (doc: AdminDocumentRecord) => void;
  isDraft?: boolean;
  isDragging?: boolean;
}) {
  const [nameEn, setNameEn] = useState(document.name_en);
  const [nameBg, setNameBg] = useState(document.name_bg ?? "");
  const [source, setSource] = useState(document.source);
  const [generalUse, setGeneralUse] = useState(document.general_use);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const saveRequestRef = useRef(0);
  const syncedDocumentIdRef = useRef(document.id);
  const callbacksRef = useRef({ onError, onSaveDocument, onUpdated });

  useEffect(() => {
    callbacksRef.current = { onError, onSaveDocument, onUpdated };
  }, [onError, onSaveDocument, onUpdated]);

  useEffect(() => {
    if (syncedDocumentIdRef.current === document.id) {
      return;
    }

    syncedDocumentIdRef.current = document.id;
    setNameEn(document.name_en);
    setNameBg(document.name_bg ?? "");
    setSource(document.source);
    setGeneralUse(document.general_use);
    setSaveState("idle");
  }, [document.general_use, document.id, document.name_bg, document.name_en, document.source]);

  const dirty =
    nameEn !== document.name_en ||
    nameBg !== (document.name_bg ?? "") ||
    source !== document.source ||
    generalUse !== document.general_use;

  useEffect(() => {
    if (!isDraft) {
      return;
    }

    if (
      nameEn === document.name_en &&
      nameBg === (document.name_bg ?? "") &&
      source === document.source &&
      generalUse === document.general_use
    ) {
      return;
    }

    onDraftDocumentUpdated?.({
      ...document,
      name_en: nameEn,
      name_bg: nameBg,
      source,
      general_use: generalUse,
    });
  }, [document, generalUse, isDraft, nameBg, nameEn, onDraftDocumentUpdated, source]);

  useEffect(() => {
    if (isDraft) {
      return;
    }

    if (!dirty) {
      return;
    }

    if (!nameEn.trim()) {
      setSaveState("error");
      return;
    }

    setSaveState("idle");

    const timeout = window.setTimeout(() => {
      const requestId = saveRequestRef.current + 1;
      saveRequestRef.current = requestId;
      setSaveState("saving");

      callbacksRef.current.onSaveDocument({
        id: document.id,
        name_en: nameEn,
        name_bg: nameBg,
        source,
        general_use: generalUse,
      })
        .then((updated) => {
          if (saveRequestRef.current !== requestId) {
            return;
          }

          callbacksRef.current.onUpdated(updated);
          setSaveState("saved");
        })
        .catch((error) => {
          if (saveRequestRef.current !== requestId) {
            return;
          }

          setSaveState("error");
          callbacksRef.current.onError(
            error instanceof Error ? error.message : "Unable to update document.",
          );
        });
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    dirty,
    document.id,
    generalUse,
    isDraft,
    nameBg,
    nameEn,
    source,
  ]);

  function getSaveLabel() {
    if (!nameEn.trim()) {
      return "Name is required";
    }

    if (isDraft) {
      if (!isValidDocumentUrl(source)) {
        return "Valid link is required";
      }

      return "Will be created when you save";
    }

    if (saveState === "saving") {
      return "Saving...";
    }

    if (saveState === "saved" && !dirty) {
      return "Saved";
    }

    if (saveState === "error") {
      return "Could not save";
    }

    if (dirty) {
      return "Autosaves in a moment";
    }

    return "";
  }

  function handleCardDragStart(event: DragEvent<HTMLDivElement>) {
    if (isInteractiveDragTarget(event.target)) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", document.id);
    onDragStart?.();
  }

  return (
    <div
      draggable
      onDragStart={handleCardDragStart}
      onDragEnd={onDragEnd}
      className={`min-w-0 cursor-grab rounded-[1.25rem] border border-black/10 bg-white/90 p-4 shadow-sm transition-all active:cursor-grabbing ${
        isDragging ? "border-primary/30 bg-primary/[0.03] shadow-md ring-2 ring-primary/30" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
          <Icon icon="ph:file-text-bold" width={20} height={20} />
        </div>
        <div className="min-w-0 flex-1">
          {isDraft ? (
            <p className="block truncate font-semibold text-primary">
              Draft link document
            </p>
          ) : (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-semibold text-primary hover:underline"
            >
              Click to open
            </a>
          )}
          <p className="mt-1 text-sm text-dark/50">
            {isDraft
              ? "Created when you save this event"
              : `Uploaded ${formatTimestamp(document.updated_at)}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            data-card-drag-handle
            className="inline-flex cursor-grab select-none items-center gap-2 rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm font-medium text-dark/70 active:cursor-grabbing"
            aria-label={`Drag to reorder ${document.name_en}`}
            title="Drag to reorder"
          >
            <Icon icon="ph:dots-six-vertical-bold" width={16} height={16} />
          </button>
        </div>
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
        {isDraft ? (
          <InlineAdminField
            label="Link"
            value={source}
            onChange={setSource}
            required
          />
        ) : null}
        {/* <label className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark">
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
        </label> */}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p
          className={`text-sm font-medium ${
            saveState === "error" || !nameEn.trim()
              ? "text-red-500"
              : saveState === "saved"
                ? "text-emerald-600"
                : "text-dark/50"
          }`}
        >
          {getSaveLabel()}
        </p>
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
  draftDocumentIds = [],
  onChange,
  onReorder,
  onError,
  onDocumentsCreated,
  onDocumentUpdated,
  onDraftDocumentCreated,
  onDraftDocumentUpdated,
  onCreateDocuments,
  onCreateDocumentFromUrl,
  onSaveDocument,
  allowSelectExistingDocuments = false,
}: EventDocumentReferenceFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [draggedValue, setDraggedValue] = useState<string | null>(null);
  const [dragOverValue, setDragOverValue] = useState<string | null>(null);

  const draftDocumentIdSet = new Set(draftDocumentIds);
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
      onChange(prependUniqueValues(values, createdDocs.map((item) => item.id)));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAddLink({
    url,
    name,
    nameBg,
  }: {
    url: string;
    name: string;
    nameBg: string;
  }) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      onError("Please enter a valid URL (including https://).");
      return;
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      onError("Links must start with http:// or https://.");
      return;
    }

    setAddingLink(true);

    try {
      const fallbackName = name || getDocumentNameFromUrl(url) || url;
      if (onDraftDocumentCreated) {
        const draft = createDraftDocumentFromUrl(url);
        onDraftDocumentCreated({
          ...draft,
          name_en: fallbackName,
          name_bg: nameBg,
        });
        onChange(prependUniqueValues(values, [draft.id]));
        return;
      }

      const created = await onCreateDocumentFromUrl({
        url,
        name: fallbackName,
        nameBg,
        generalUse: false,
      });
      onDocumentsCreated([created]);
      if (!values.includes(created.id)) {
        onChange(prependUniqueValues(values, [created.id]));
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to add link.");
    } finally {
      setAddingLink(false);
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

    onChange(
      prependUniqueValues(values, selectedDocuments.map((item) => item.id)),
    );
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
    <div className="min-w-0">
      <FileDropPanel
        label={label}
        multiple
        uploading={uploading}
        onFiles={handleFiles}
        helperText="Drop files here to create document records and attach them to this event."
      />

      <LinkInputPanel onSubmit={handleAddLink} busy={addingLink} />

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
        <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
          {values.map((value, index) => {
            const document = documentsById.get(value);
            const isDraft = draftDocumentIdSet.has(value);

            if (document) {
              return (
                <div
                  key={`${value}-${index}`}
                  onDragOver={(event) => handleDragOver(event, value)}
                  onDrop={() => handleDrop(value)}
                  className={`min-w-0 rounded-[1.35rem] transition-all ${
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
                    onDraftDocumentUpdated={onDraftDocumentUpdated}
                    isDraft={isDraft}
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
