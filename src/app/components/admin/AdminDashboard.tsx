"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import DatePicker from "react-datepicker";
import toast from "react-hot-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import EventDocumentReferenceField from "@/app/components/admin/EventDocumentReferenceField";
import { ExternalLink } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { localizeText } from "@/lib/localizedContent";
import { slugify } from "@/lib/slug";
import type {
  AdminDocumentRecord,
  AdminEventRecord,
  AdminNewsRecord,
} from "@/types/admin";
import type { RegistrationRecord, RegistrationStatus } from "@/types/admin";
import moment from "moment";

type AdminDashboardProps = {
  userEmail: string;
  initialEvents: AdminEventRecord[];
  initialNews: AdminNewsRecord[];
  initialDocuments: AdminDocumentRecord[];
};

type PaymentStatusResponse = {
  data?: {
    enabled?: boolean;
  };
};

type PublishStatus = 1 | 2 | 3;
type PublishStatusValue = "1" | "2" | "3";

type EventFormState = {
  id: string | null;
  slug: string;
  name_en: string;
  name_bg: string;
  description_en: string;
  description_bg: string;
  thumbnail_img: string;
  status: PublishStatusValue;
  start_date: string;
  end_date: string;
  documents: string[];
  notice_board: string[];
  results: string[];
  register_form: string[];
};

type NewsFormState = {
  id: string | null;
  slug: string;
  name_en: string;
  name_bg: string;
  body_en: string;
  body_bg: string;
  status: PublishStatusValue;
  attachments: string[];
};

type DocumentFormState = {
  id: string | null;
  name_en: string;
  name_bg: string;
  source: string;
  general_use: boolean;
};

type AssetBucket = "images" | "documents";

type StorageAsset = {
  bucket: AssetBucket;
  path: string;
  name: string;
  url: string;
};

const statusOptions = [
  { value: "1", label: "Active" },
  { value: "2", label: "Archived" },
  { value: "3", label: "Hidden" },
] as const;

const interactiveButtonClass =
  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md";

const imageUrlPattern = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

const editorImageSizes = {
  small: "35%",
  medium: "55%",
  large: "75%",
  full: "100%",
} as const;

type EditorImageSize = keyof typeof editorImageSizes;

const RichImageExtension = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: "full",
        parseHTML: (element) => {
          const size = element.getAttribute("data-size");
          return size && size in editorImageSizes ? size : "full";
        },
        renderHTML: (attributes) => {
          const size =
            typeof attributes.size === "string" &&
            attributes.size in editorImageSizes
              ? (attributes.size as EditorImageSize)
              : "full";

          return {
            "data-size": size,
            style: `width:${editorImageSizes[size]};max-width:100%;height:auto;display:block;margin:1rem auto;`,
          };
        },
      },
    };
  },
});

function getStatusLabel(status: PublishStatus) {
  return (
    statusOptions.find((option) => option.value === String(status))?.label ??
    String(status)
  );
}

function getEventStatusCardClasses(status: PublishStatus) {
  switch (status) {
    case 1:
      return "border-emerald-200 bg-emerald-50/90";
    case 2:
      return "border-slate-300 bg-slate-100/90";
    case 3:
      return "border-amber-200 bg-amber-50/90";
    default:
      return "border-black/10 bg-white/90";
  }
}

function getEventStatusButtonClasses(
  buttonValue: string,
  activeValue: PublishStatus,
) {
  const isActive = buttonValue === String(activeValue);

  if (buttonValue === "1") {
    return isActive
      ? "border-emerald-600 bg-emerald-600 text-white"
      : "border-emerald-200 bg-white/70 text-emerald-700 hover:bg-emerald-50";
  }

  if (buttonValue === "2") {
    return isActive
      ? "border-slate-600 bg-slate-600 text-white"
      : "border-slate-300 bg-white/70 text-slate-700 hover:bg-slate-50";
  }

  return isActive
    ? "border-amber-500 bg-amber-500 text-white"
    : "border-amber-200 bg-white/70 text-amber-700 hover:bg-amber-50";
}

function emptyEventForm(): EventFormState {
  return {
    id: null,
    slug: "",
    name_en: "",
    name_bg: "",
    description_en: "",
    description_bg: "",
    thumbnail_img: "",
    status: "1",
    start_date: "",
    end_date: "",
    documents: [],
    notice_board: [],
    results: [],
    register_form: [],
  };
}

function emptyNewsForm(): NewsFormState {
  return {
    id: null,
    slug: "",
    name_en: "",
    name_bg: "",
    body_en: "",
    body_bg: "",
    status: "1",
    attachments: [],
  };
}

function emptyDocumentForm(): DocumentFormState {
  return {
    id: null,
    name_en: "",
    name_bg: "",
    source: "",
    general_use: false,
  };
}

function eventToForm(event: AdminEventRecord): EventFormState {
  return {
    id: event.id,
    slug: event.slug,
    name_en: event.name_en,
    name_bg: event.name_bg ?? "",
    description_en: event.description_en ?? "",
    description_bg: event.description_bg ?? "",
    thumbnail_img: event.thumbnail_img ?? "",
    status: String(event.status) as EventFormState["status"],
    start_date: event.start_date,
    end_date: event.end_date,
    documents: event.documents ?? [],
    notice_board: event.notice_board ?? [],
    results: event.results ?? [],
    register_form: event.register_form ?? [],
  };
}

function newsToForm(item: AdminNewsRecord): NewsFormState {
  return {
    id: item.id,
    slug: item.slug,
    name_en: item.name_en,
    name_bg: item.name_bg ?? "",
    body_en: item.body_en,
    body_bg: item.body_bg ?? "",
    status: String(item.status) as NewsFormState["status"],
    attachments: item.attachments,
  };
}

function documentToForm(item: AdminDocumentRecord): DocumentFormState {
  return {
    id: item.id,
    name_en: item.name_en,
    name_bg: item.name_bg ?? "",
    source: item.source,
    general_use: item.general_use,
  };
}

function formatTimestamp(value: string) {
  return moment(value).format("DD-MM-YYYY");
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function isImageUrl(url: string) {
  return (
    imageUrlPattern.test(url) ||
    url.includes("/storage/v1/object/public/images/")
  );
}

function getFileLabelFromUrl(url: string) {
  const label = url.split("/").pop()?.split("?")[0] || url;
  return decodeURIComponent(label);
}

function getDocumentNameFromFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function createUploadPath(file: File) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const safeName = slugify(baseName) || "file";

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}${ext ? `.${ext}` : ""}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeHref(value: string) {
  return /^(https?:|mailto:|tel:|\/)/i.test(value.trim());
}

function isSafeImageSrc(value: string) {
  return /^(https?:|data:image\/|\/)/i.test(value.trim());
}

function applyImagePresentation(
  image: HTMLImageElement,
  size: EditorImageSize = "full",
) {
  image.dataset.size = size;
  image.removeAttribute("width");
  image.removeAttribute("height");
  image.style.width = editorImageSizes[size];
  image.style.maxWidth = "100%";
  image.style.height = "auto";
  image.style.display = "block";
  image.style.margin = "1rem auto";
}

function createImageMarkup(
  url: string,
  alt: string,
  size: EditorImageSize = "full",
) {
  const safeAlt = escapeHtml(alt.trim() || "Image");
  const safeUrl = escapeHtml(url);

  return `<p><img src="${safeUrl}" alt="${safeAlt}" data-size="${size}" style="width:${editorImageSizes[size]};max-width:100%;height:auto;display:block;margin:1rem auto;" /></p>`;
}

function unwrapElement(element: HTMLElement) {
  element.replaceWith(...Array.from(element.childNodes));
}

function sanitizePastedHtml(html: string) {
  if (typeof window === "undefined") {
    return html;
  }

  const parser = new window.DOMParser();
  const documentFragment = parser.parseFromString(
    `<body>${html}</body>`,
    "text/html",
  );
  const allowedTags = new Set([
    "a",
    "blockquote",
    "br",
    "em",
    "figcaption",
    "figure",
    "h2",
    "h3",
    "h4",
    "img",
    "li",
    "ol",
    "p",
    "strong",
    "u",
    "ul",
  ]);
  const unwrapTags = new Set([
    "article",
    "div",
    "font",
    "header",
    "main",
    "section",
    "span",
  ]);
  const removeTags = new Set([
    "button",
    "form",
    "iframe",
    "input",
    "link",
    "meta",
    "object",
    "script",
    "select",
    "style",
    "svg",
    "textarea",
  ]);

  function cleanNode(node: Node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === window.Node.COMMENT_NODE) {
        child.remove();
        return;
      }

      if (child.nodeType !== window.Node.ELEMENT_NODE) {
        return;
      }

      const element = child as HTMLElement;
      const tag = element.tagName.toLowerCase();

      cleanNode(element);

      if (tag === "b") {
        const strong = documentFragment.createElement("strong");
        strong.innerHTML = element.innerHTML;
        element.replaceWith(strong);
        return;
      }

      if (tag === "i") {
        const em = documentFragment.createElement("em");
        em.innerHTML = element.innerHTML;
        element.replaceWith(em);
        return;
      }

      if (removeTags.has(tag)) {
        element.remove();
        return;
      }

      if (unwrapTags.has(tag) || !allowedTags.has(tag)) {
        unwrapElement(element);
        return;
      }

      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (name.startsWith("on") || name === "class" || name === "id") {
          element.removeAttribute(attribute.name);
        }
      });

      if (tag === "a") {
        const href = element.getAttribute("href")?.trim() ?? "";
        if (!isSafeHref(href)) {
          unwrapElement(element);
          return;
        }

        element.setAttribute("href", href);
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");

        Array.from(element.attributes).forEach((attribute) => {
          if (
            !["href", "target", "rel"].includes(attribute.name.toLowerCase())
          ) {
            element.removeAttribute(attribute.name);
          }
        });
      }

      if (tag === "img") {
        const image = element as HTMLImageElement;
        const src = image.getAttribute("src")?.trim() ?? "";
        if (!isSafeImageSrc(src)) {
          image.remove();
          return;
        }

        const alt = image.getAttribute("alt")?.trim() ?? "Image";
        const size =
          (image.getAttribute("data-size") as EditorImageSize | null) ?? "full";

        image.setAttribute("src", src);
        image.setAttribute("alt", alt);
        image.setAttribute("loading", "lazy");
        Array.from(image.attributes).forEach((attribute) => {
          if (
            !["src", "alt", "loading", "data-size", "style"].includes(
              attribute.name.toLowerCase(),
            )
          ) {
            image.removeAttribute(attribute.name);
          }
        });
        applyImagePresentation(image, size in editorImageSizes ? size : "full");
      }
    });
  }

  cleanNode(documentFragment.body);

  return documentFragment.body.innerHTML;
}

function plainTextToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function normalizeEditorHtml(value: string) {
  const normalized = value.trim();

  if (!normalized || normalized === "<p></p>") {
    return "";
  }

  return normalized;
}

async function readJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload as T;
}

async function uploadFile(
  file: File,
  options: { bucket?: AssetBucket; requireImage?: boolean } = {},
): Promise<string> {
  if (options.requireImage && !isImageFile(file)) {
    throw new Error("Please upload an image file.");
  }

  const supabase = createSupabaseBrowserClient();
  const bucket = options.bucket ?? (isImageFile(file) ? "images" : "documents");
  const path = createUploadPath(file);

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function createAdminDocument(args: {
  file: File;
  generalUse?: boolean;
}): Promise<AdminDocumentRecord> {
  const source = await uploadFile(args.file);
  const fallbackName =
    getDocumentNameFromFileName(args.file.name) || args.file.name;
  const payload = await readJson<{ data: AdminDocumentRecord }>(
    "/api/admin/documents",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name_en: fallbackName,
        name_bg: "",
        source,
        general_use: Boolean(args.generalUse),
      }),
    },
  );

  return payload.data;
}

async function listStorageAssets(bucket: AssetBucket): Promise<StorageAsset[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage.from(bucket).list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => ({
      bucket,
      path: item.name,
      name: item.name,
      url: supabase.storage.from(bucket).getPublicUrl(item.name).data.publicUrl,
    }));
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-dark">{title}</h2>
      <p className="mt-2 max-w-3xl  leading-6 text-dark/60">{description}</p>
    </div>
  );
}

const adminFieldInputClassName =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-dark/55";

function parseAdminDateValue(value: string) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.slice(0, 10);
  const [year, month, day] = normalizedValue.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatAdminDateValue(value: Date | null) {
  if (!value) {
    return "";
  }

  return format(value, "yyyy-MM-dd");
}

function AdminField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block  font-medium text-dark">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={adminFieldInputClassName}
      />
    </label>
  );
}

function AdminDateField({
  label,
  value,
  onChange,
  placeholder = "Select date",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-medium text-dark">{label}</span>
      <div className="relative">
        <DatePicker
          selected={parseAdminDateValue(value)}
          onChange={(date) => onChange(formatAdminDateValue(date))}
          required={required}
          disabled={disabled}
          shouldCloseOnSelect
          dateFormat="dd-MM-yyyy"
          placeholderText={placeholder}
          locale={enUS}
          className={`${adminFieldInputClassName} pr-12`}
          calendarClassName="event-registration-datepicker"
          popperClassName="event-registration-datepicker-popper"
          popperProps={{ strategy: "fixed" }}
          portalId="event-registration-datepicker-portal"
          wrapperClassName="w-full"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-primary">
          <Icon icon="ph:calendar-blank-bold" width={18} height={18} />
        </span>
      </div>
    </label>
  );
}

function AdminTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block  font-medium text-dark">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3  text-dark outline-none transition focus:border-primary"
      />
    </label>
  );
}

function formatOptionalValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function formatBooleanValue(value: boolean) {
  return value ? "Yes" : "No";
}

function getRegistrationStatusBadgeClasses(status: RegistrationStatus) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function getRegistrationStatusButtonClasses(
  buttonValue: RegistrationStatus,
  activeValue: RegistrationStatus,
) {
  const isActive = buttonValue === activeValue;

  if (buttonValue === "approved") {
    return isActive
      ? "border-emerald-600 bg-emerald-600 text-white"
      : "border-emerald-200 bg-white/70 text-emerald-700 hover:bg-emerald-50";
  }

  if (buttonValue === "rejected") {
    return isActive
      ? "border-red-600 bg-red-600 text-white"
      : "border-red-200 bg-white/70 text-red-700 hover:bg-red-50";
  }

  return isActive
    ? "border-amber-500 bg-amber-500 text-white"
    : "border-amber-200 bg-white/70 text-amber-700 hover:bg-amber-50";
}

function RegistrationDetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dark/45">
        {label}
      </p>
      <div className="mt-2  leading-6 text-dark/75">{value}</div>
    </div>
  );
}

function AddCardButton({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[1.5rem] border border-dashed border-primary/30 bg-white/80 p-5 text-left shadow-sm ${interactiveButtonClass}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md transition-transform duration-200 group-hover:scale-105">
          <Icon icon="ph:plus-bold" width={22} height={22} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dark">{title}</h3>
          <p className="mt-1  leading-6 text-dark/60">{description}</p>
        </div>
      </div>
    </button>
  );
}

function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-dark/45 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-[0_30px_100px_rgba(23,32,35,0.2)] animate-in zoom-in-95 slide-in-from-bottom-6 duration-300 md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-dark">{title}</h3>
            <p className="mt-1  leading-6 text-dark/60">{description}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
          >
            Close
          </Button>
        </div>

        {children}
      </div>
    </div>
  );
}

function HtmlEditor({
  label,
  value,
  onChange,
  onError,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onError: (message: string) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrlDraft, setLinkUrlDraft] = useState("");
  const [linkLabelDraft, setLinkLabelDraft] = useState("");
  const [linkCanRemove, setLinkCanRemove] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [selectedImageSize, setSelectedImageSize] =
    useState<EditorImageSize | null>(null);
  const linkSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      LinkExtension.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      RichImageExtension,
      Placeholder.configure({
        placeholder: "Start writing here...",
      }),
    ],
    content: normalizeEditorHtml(value) || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "blog-details admin-rich-editor__content prose prose-lg prose-zinc max-w-none",
      },
      transformPastedHTML: (html) => sanitizePastedHtml(html),
      handlePaste: (_view, event) => {
        const clipboard = event.clipboardData;
        const imageItem = Array.from(clipboard?.items ?? []).find((item) =>
          item.type.startsWith("image/"),
        );

        if (imageItem) {
          const file = imageItem.getAsFile();
          if (!file) {
            return false;
          }

          event.preventDefault();
          void handleImageUpload(file);
          return true;
        }

        const html = clipboard?.getData("text/html");
        if (html) {
          event.preventDefault();
          const cleanHtml = sanitizePastedHtml(html);
          if (cleanHtml.trim()) {
            insertHtml(cleanHtml);
          }
          return true;
        }

        const text = clipboard?.getData("text/plain");
        if (text) {
          event.preventDefault();
          insertHtml(plainTextToHtml(text));
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(normalizeEditorHtml(activeEditor.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const incomingHtml = normalizeEditorHtml(value);
    const currentHtml = normalizeEditorHtml(editor.getHTML());

    if (incomingHtml !== currentHtml) {
      editor.commands.setContent(incomingHtml || "<p></p>", {
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateSelectedImageState = () => {
      if (!editor.isActive("image")) {
        setSelectedImageSize(null);
        return;
      }

      const size = editor.getAttributes("image").size;
      setSelectedImageSize(
        typeof size === "string" && size in editorImageSizes
          ? (size as EditorImageSize)
          : "full",
      );
    };

    updateSelectedImageState();
    editor.on("selectionUpdate", updateSelectedImageState);
    editor.on("update", updateSelectedImageState);

    return () => {
      editor.off("selectionUpdate", updateSelectedImageState);
      editor.off("update", updateSelectedImageState);
    };
  }, [editor]);

  function insertHtml(html: string) {
    editor?.chain().focus().insertContent(html).run();
  }

  function closeLinkModal() {
    setLinkModalOpen(false);
    setLinkUrlDraft("");
    setLinkLabelDraft("");
    setLinkCanRemove(false);
    linkSelectionRef.current = null;
  }

  function getSavedSelectionChain() {
    if (!editor) {
      return null;
    }

    const selection = linkSelectionRef.current;
    let chain = editor.chain().focus();

    if (selection) {
      chain = chain.setTextSelection(selection);
    }

    return chain;
  }

  function openLinkModal() {
    if (!editor) {
      return;
    }

    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").run();
    }

    const previousUrl = editor.getAttributes("link").href ?? "";
    const { from, to } = editor.state.selection;
    const currentText = editor.state.doc.textBetween(from, to, " ").trim();

    linkSelectionRef.current = { from, to };
    setLinkUrlDraft(previousUrl);
    setLinkLabelDraft(currentText || previousUrl);
    setLinkCanRemove(Boolean(previousUrl));
    setLinkModalOpen(true);
  }

  function handleLinkSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const chain = getSavedSelectionChain();
    if (!chain) {
      return;
    }

    const normalizedUrl = linkUrlDraft.trim();

    if (!normalizedUrl) {
      onError("Enter a URL.");
      return;
    }

    if (!isSafeHref(normalizedUrl)) {
      onError("Enter a valid URL starting with https://, http://, mailto:, tel:, or /.");
      return;
    }

    const normalizedLabel = linkLabelDraft.trim() || normalizedUrl;
    const safeUrl = escapeHtml(normalizedUrl);
    const safeLabel = escapeHtml(normalizedLabel);

    if (!chain.insertContent(`<a href="${safeUrl}">${safeLabel}</a>`).run()) {
      onError("Unable to insert link.");
      return;
    }

    closeLinkModal();
  }

  function handleLinkRemove() {
    const chain = getSavedSelectionChain();
    if (!chain) {
      return;
    }

    chain.extendMarkRange("link").unsetLink().run();
    closeLinkModal();
  }

  async function handleImageUpload(file: File) {
    setUploadingImage(true);

    try {
      const url = await uploadFile(file, {
        bucket: "images",
        requireImage: true,
      });
      insertHtml(createImageMarkup(url, file.name));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  }

  async function handleFileUpload(file: File) {
    setUploadingFile(true);

    try {
      const url = await uploadFile(file);
      const label = file.name.replace(/\]/g, "").trim() || "Download file";
      insertHtml(`<p><a href="${url}">${label}</a></p>`);
    } catch (error) {
      onError(error instanceof Error ? error.message : "File upload failed.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function resizeSelectedImage(size: EditorImageSize) {
    if (!editor?.isActive("image")) {
      onError("Select an image in the editor first.");
      return;
    }

    editor.chain().focus().updateAttributes("image", { size }).run();
    setSelectedImageSize(size);
  }

  function getToolButtonClass(active = false) {
    return `inline-flex w-auto items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold leading-none transition-all duration-200 ${
      active
        ? "border-primary bg-primary text-white shadow-md hover:bg-primary hover:text-white"
        : "border-black/10 bg-white text-dark hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-md"
    }`;
  }

  function getIconToolButtonClass(active = false) {
    return `${getToolButtonClass(active)} h-11 min-w-11 px-0`;
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#fffdf8] shadow-[0_20px_60px_rgba(23,32,35,0.08)]">
      <div className="border-b border-black/10 bg-gradient-to-r from-white via-[#f9f6ee] to-white px-5 py-4">
        <div>
          <div>
            <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-dark/50">
              {label}
            </span>
            <p className="mt-1 text-sm leading-6 text-dark/60">
              Write comfortably, paste from other sources, and use the toolbar
              to format content.
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-black/10 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={getToolButtonClass(
              editor?.isActive("heading", { level: 2 }) ?? false,
            )}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            H2
          </button>
          <button
            type="button"
            className={getToolButtonClass(
              editor?.isActive("heading", { level: 3 }) ?? false,
            )}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            H3
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive("bold") ?? false,
            )}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            aria-label="Bold"
            title="Bold"
          >
            <Icon icon="mdi:format-bold" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive("italic") ?? false,
            )}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            title="Italic"
          >
            <Icon icon="mdi:format-italic" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive("underline") ?? false,
            )}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            title="Underline"
          >
            <Icon icon="mdi:format-underline" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive("link") ?? false,
            )}
            onClick={openLinkModal}
            aria-label="Link"
            title="Link"
          >
            <Icon icon="mdi:link-variant" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive("bulletList") ?? false,
            )}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            aria-label="Bulleted list"
            title="Bulleted list"
          >
            <Icon icon="mdi:format-list-bulleted" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive("blockquote") ?? false,
            )}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            aria-label="Quote"
            title="Quote"
          >
            <Icon icon="mdi:format-quote-open" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive({ textAlign: "left" }) ?? false,
            )}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            aria-label="Align left"
            title="Align left"
          >
            <Icon icon="mdi:format-align-left" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive({ textAlign: "center" }) ?? false,
            )}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
            aria-label="Align center"
            title="Align center"
          >
            <Icon icon="mdi:format-align-center" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive({ textAlign: "right" }) ?? false,
            )}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
            aria-label="Align right"
            title="Align right"
          >
            <Icon icon="mdi:format-align-right" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(
              editor?.isActive({ textAlign: "justify" }) ?? false,
            )}
            onClick={() =>
              editor?.chain().focus().setTextAlign("justify").run()
            }
            aria-label="Justify"
            title="Justify"
          >
            <Icon icon="mdi:format-align-justify" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getIconToolButtonClass(false)}
            onClick={() => {
              editor?.chain().focus().unsetAllMarks().clearNodes().run();
            }}
            aria-label="Clear formatting"
            title="Clear formatting"
          >
            <Icon icon="mdi:format-clear" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className={getToolButtonClass(false)}
            onClick={() => imageInputRef.current?.click()}
          >
            <Icon icon="mdi:image-plus" className="h-5 w-5" />
            {uploadingImage ? "Uploading image..." : "Add image"}
          </button>
          <button
            type="button"
            className={getToolButtonClass(false)}
            onClick={() => setImagePickerOpen(true)}
          >
            <Icon icon="mdi:image-search-outline" className="h-5 w-5" />
            Reuse image
          </button>
          <button
            type="button"
            className={getToolButtonClass(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon icon="mdi:file-plus-outline" className="h-5 w-5" />
            {uploadingFile ? "Uploading file..." : "Add file"}
          </button>
          <button
            type="button"
            className={getToolButtonClass(false)}
            onClick={() => setFilePickerOpen(true)}
          >
            <Icon icon="mdi:file-search-outline" className="h-5 w-5" />
            Reuse file
          </button>
          {(["small", "medium", "large", "full"] as EditorImageSize[]).map(
            (size) => (
              <button
                key={size}
                type="button"
                className={getToolButtonClass(selectedImageSize === size)}
                onClick={() => resizeSelectedImage(size)}
              >
                Img {size.charAt(0).toUpperCase()}
              </button>
            ),
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleImageUpload(file);
              }
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
          />
        </div>
      </div>

      <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,243,232,0.72))] p-4 sm:p-5">
        <EditorContent editor={editor} />
      </div>
      <AssetPickerModal
        open={imagePickerOpen}
        title="Image library"
        bucket="images"
        onClose={() => setImagePickerOpen(false)}
        onSelect={(url) => insertHtml(createImageMarkup(url, "Image"))}
      />

      <AssetPickerModal
        open={filePickerOpen}
        title="Document library"
        bucket="documents"
        onClose={() => setFilePickerOpen(false)}
        onSelect={(url) =>
          insertHtml(`<p><a href="${url}">${getFileLabelFromUrl(url)}</a></p>`)
        }
      />

      <AdminModal
        open={linkModalOpen}
        title="Insert link"
        description="Add the destination URL and the text that should appear in the news article."
        onClose={closeLinkModal}
      >
        <form onSubmit={handleLinkSave}>
          <div className="grid gap-4">
            <AdminField
              label="URL"
              value={linkUrlDraft}
              onChange={setLinkUrlDraft}
              placeholder="https://example.com"
              required
            />
            <AdminField
              label="Link text"
              value={linkLabelDraft}
              onChange={setLinkLabelDraft}
              placeholder={linkUrlDraft || "Displayed text"}
            />
            <p className="text-sm text-dark/55">
              If link text is left empty, the URL itself will be shown.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" className="rounded-xl px-5 text-white">
              Save link
            </Button>
            {linkCanRemove ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleLinkRemove}
                className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
              >
                Remove link
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={closeLinkModal}
              className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
            >
              Cancel
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}

function AssetPreviewCard({
  url,
  onRemove,
  showActions = true,
}: {
  url: string;
  onRemove?: () => void;
  showActions?: boolean;
}) {
  const image = isImageUrl(url);

  return (
    <div className="rounded-[1.25rem] border-none p-3">
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={getFileLabelFromUrl(url)}
            className="mb-3 h-32 w-full rounded-xl object-cover"
          />
          <p className="truncate  font-medium text-dark/70">
            {getFileLabelFromUrl(url)}
          </p>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon icon="ph:file-text-bold" width={20} height={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate  font-medium text-dark">
              {getFileLabelFromUrl(url)}
            </p>
            <p className="truncate  text-dark/55">{url}</p>
          </div>
        </div>
      )}

      {showActions ? (
        <div className="mt-3 flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className=" font-semibold text-primary hover:underline"
          >
            Preview
          </a>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className=" font-semibold text-red-500 hover:underline"
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AssetPickerModal({
  open,
  title,
  bucket,
  onClose,
  onSelect,
}: {
  open: boolean;
  title: string;
  bucket: AssetBucket;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [assets, setAssets] = useState<StorageAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadAssets() {
      setLoading(true);

      try {
        const nextAssets = await listStorageAssets(bucket);
        if (!cancelled) {
          setAssets(nextAssets);
        }
      } catch {
        if (!cancelled) {
          setAssets([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [bucket, open]);

  return (
    <AdminModal
      open={open}
      title={title}
      description="Reuse a file you already uploaded to Supabase storage."
      onClose={onClose}
    >
      {loading ? (
        <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white/80 px-5 py-10  text-dark/60">
          Loading files...
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white/80 px-5 py-10  text-dark/60">
          No uploaded files found in this library yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <button
              key={`${asset.bucket}:${asset.path}`}
              type="button"
              onClick={() => {
                onSelect(asset.url);
                onClose();
              }}
              className={`rounded-[1.25rem] border border-black/10 bg-white/90 p-3 text-left shadow-sm ${interactiveButtonClass}`}
            >
              <AssetPreviewCard url={asset.url} showActions={false} />
            </button>
          ))}
        </div>
      )}
    </AdminModal>
  );
}

function FileDropPanel({
  label,
  onFiles,
  accept,
  multiple = false,
  uploading = false,
  helperText,
  onOpenLibrary,
  libraryLabel,
}: {
  label: string;
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  uploading?: boolean;
  helperText?: string;
  onOpenLibrary?: () => void;
  libraryLabel?: string;
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
      <span className="mb-2 block  font-medium text-dark">{label}</span>
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
            <p className=" font-semibold text-dark">
              {uploading ? "Uploading files..." : "Upload files"}
            </p>
            <p className="mt-1  text-dark/60">
              {helperText ??
                "Drag and drop files or click the input to start selecting."}
            </p>
            {onOpenLibrary ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenLibrary();
                }}
                className="mt-3  font-semibold text-primary hover:underline"
              >
                {libraryLabel ?? "Reuse uploaded"}
              </button>
            ) : null}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
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

function ImageUploadField({
  label,
  value,
  onChange,
  onError,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleFiles(files: File[]) {
    const file = files[0];

    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const url = await uploadFile(file, {
        bucket: "images",
        requireImage: true,
      });
      onChange(url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <FileDropPanel
        label={label}
        accept="image/*"
        uploading={uploading}
        onFiles={handleFiles}
        helperText="Drop an image here or choose one. You can also reuse something from the image library."
        onOpenLibrary={() => setPickerOpen(true)}
        libraryLabel="Reuse image"
      />

      {value ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <AssetPreviewCard url={value} onRemove={() => onChange("")} />
        </div>
      ) : null}

      <AssetPickerModal
        open={pickerOpen}
        title="Image library"
        bucket="images"
        onClose={() => setPickerOpen(false)}
        onSelect={onChange}
      />
    </div>
  );
}

function SingleFileUploadField({
  label,
  value,
  onChange,
  onError,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
  required?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleFiles(files: File[]) {
    const file = files[0];

    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {required ? (
        <input
          type="text"
          required
          value={value}
          readOnly
          tabIndex={-1}
          className="sr-only"
          aria-hidden="true"
        />
      ) : null}

      <FileDropPanel
        label={label}
        uploading={uploading}
        onFiles={handleFiles}
        helperText="Drop a file here or choose one. Images go to the image bucket, other files go to documents."
        onOpenLibrary={() => setPickerOpen(true)}
        libraryLabel="Reuse file"
      />

      {value ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <AssetPreviewCard url={value} onRemove={() => onChange("")} />
        </div>
      ) : null}

      <AssetPickerModal
        open={pickerOpen}
        title="Document library"
        bucket="documents"
        onClose={() => setPickerOpen(false)}
        onSelect={onChange}
      />
    </div>
  );
}

export default function AdminDashboard({
  userEmail,
  initialEvents,
  initialNews,
  initialDocuments,
}: AdminDashboardProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [news, setNews] = useState(initialNews);
  const [documents, setDocuments] = useState(initialDocuments);
  const [eventForm, setEventForm] = useState<EventFormState>(emptyEventForm());
  const [newsForm, setNewsForm] = useState<NewsFormState>(emptyNewsForm());
  const [documentForm, setDocumentForm] =
    useState<DocumentFormState>(emptyDocumentForm());
  const [eventsBusy, setEventsBusy] = useState(false);
  const [newsBusy, setNewsBusy] = useState(false);
  const [documentsBusy, setDocumentsBusy] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [entriesModalOpen, setEntriesModalOpen] = useState(false);
  const [eventDocumentsModalOpen, setEventDocumentsModalOpen] = useState(false);
  const [eventDocumentsForm, setEventDocumentsForm] =
    useState<EventFormState | null>(null);
  const [activeEntriesEvent, setActiveEntriesEvent] =
    useState<AdminEventRecord | null>(null);
  const [activeEventDocumentsEvent, setActiveEventDocumentsEvent] =
    useState<AdminEventRecord | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationStatusBusyId, setRegistrationStatusBusyId] = useState<
    string | null
  >(null);
  const [registrationActionBusyKey, setRegistrationActionBusyKey] = useState<
    string | null
  >(null);
  const [registrationStatusFilter, setRegistrationStatusFilter] =
    useState<RegistrationStatus | null>(null);
  const [downloadingBlanks, setDownloadingBlanks] = useState(false);
  const [downloadingPaidBlanks, setDownloadingPaidBlanks] = useState(false);
  const [rejectionModal, setRejectionModal] = useState<{
    registrationId: string;
    boatName: string;
  } | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPaymentStatus() {
      try {
        const response = await fetch("/api/payments/status", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | PaymentStatusResponse
          | null;

        if (!cancelled) {
          setPaymentsEnabled(Boolean(response.ok && payload?.data?.enabled));
        }
      } catch {
        if (!cancelled) {
          setPaymentsEnabled(false);
        }
      }
    }

    void loadPaymentStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  function openEventEditor(form = emptyEventForm()) {
    setEventForm(form);
    setEventModalOpen(true);
  }

  function closeEventEditor() {
    setEventModalOpen(false);
    setEventForm(emptyEventForm());
  }

  function openNewsEditor(form = emptyNewsForm()) {
    setNewsForm(form);
    setNewsModalOpen(true);
  }

  function closeNewsEditor() {
    setNewsModalOpen(false);
    setNewsForm(emptyNewsForm());
  }

  function closeEntriesModal() {
    setEntriesModalOpen(false);
    setActiveEntriesEvent(null);
    setRegistrations([]);
    setRegistrationsLoading(false);
    setRegistrationStatusBusyId(null);
    setRegistrationActionBusyKey(null);
    setRegistrationStatusFilter(null);
    setRejectionModal(null);
    setRejectionFeedback("");
    setDownloadingBlanks(false);
    setDownloadingPaidBlanks(false);
  }

  function addDocumentsToLibrary(createdDocs: AdminDocumentRecord[]) {
    setDocuments((current) => {
      const next = [...current];
      createdDocs.forEach((item) => {
        if (!next.some((existing) => existing.id === item.id)) {
          next.unshift(item);
        }
      });
      return next;
    });
  }

  function updateDocumentInLibrary(document: AdminDocumentRecord) {
    setDocuments((current) =>
      current.map((item) => (item.id === document.id ? document : item)),
    );
  }

  async function createEventDocuments(args: {
    files: File[];
    generalUse?: boolean;
  }) {
    return Promise.all(
      args.files.map((file) =>
        createAdminDocument({ file, generalUse: args.generalUse }),
      ),
    );
  }

  async function saveDocumentRecord(args: {
    id: string;
    name_en: string;
    name_bg: string;
    source: string;
    general_use: boolean;
  }) {
    const payload = await readJson<{ data: AdminDocumentRecord }>(
      `/api/admin/documents/${args.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name_en: args.name_en,
          name_bg: args.name_bg,
          source: args.source,
          general_use: args.general_use,
        }),
      },
    );

    return payload.data;
  }

  function openEventDocumentsEditor(item: AdminEventRecord) {
    setActiveEventDocumentsEvent(item);
    setEventDocumentsForm(eventToForm(item));
    setEventDocumentsModalOpen(true);
  }

  function closeEventDocumentsEditor() {
    setEventDocumentsModalOpen(false);
    setActiveEventDocumentsEvent(null);
    setEventDocumentsForm(null);
  }

  async function refreshEvents() {
    const payload = await readJson<{ data: AdminEventRecord[] }>(
      "/api/admin/events",
    );
    setEvents(payload.data);
  }

  async function refreshNews() {
    const payload = await readJson<{ data: AdminNewsRecord[] }>(
      "/api/admin/news",
    );
    setNews(payload.data);
  }

  async function refreshDocuments() {
    const payload = await readJson<{ data: AdminDocumentRecord[] }>(
      "/api/admin/documents",
    );
    setDocuments(payload.data);
  }

  async function loadRegistrations(eventId: string) {
    setRegistrationsLoading(true);

    try {
      const payload = await readJson<{ data: RegistrationRecord[] }>(
        `/api/admin/registrations?event_id=${encodeURIComponent(eventId)}`,
      );
      setRegistrations(payload.data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load registrations.",
      );
      setRegistrations([]);
    } finally {
      setRegistrationsLoading(false);
    }
  }

  async function openEventEntries(item: AdminEventRecord) {
    setActiveEntriesEvent(item);
    setEntriesModalOpen(true);
    await loadRegistrations(item.id);
  }

  async function handleEventDocumentsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!eventDocumentsForm?.id) {
      return;
    }

    setEventsBusy(true);

    try {
      await readJson(`/api/admin/events/${eventDocumentsForm.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(eventDocumentsForm),
      });

      await refreshEvents();
      toast.success("Event documents updated.");
      closeEventDocumentsEditor();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update event documents.",
      );
    } finally {
      setEventsBusy(false);
    }
  }

  async function autosaveEventDocumentOrder(
    key: "notice_board" | "results",
    values: string[],
  ) {
    setEventDocumentsForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: values,
      };
    });

    if (!eventDocumentsForm?.id) {
      return;
    }

    setEventsBusy(true);

    try {
      const nextForm = {
        ...eventDocumentsForm,
        [key]: values,
      };

      await readJson(`/api/admin/events/${eventDocumentsForm.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(nextForm),
      });

      await refreshEvents();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to autosave document order.",
      );
    } finally {
      setEventsBusy(false);
    }
  }

  async function handleSignOut() {
    setAuthBusy(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      setAuthBusy(false);
      return;
    }

    router.replace("/admin/login");
    router.refresh();
  }

  async function handleEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEventsBusy(true);

    try {
      await readJson(
        eventForm.id
          ? `/api/admin/events/${eventForm.id}`
          : "/api/admin/events",
        {
          method: eventForm.id ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(eventForm),
        },
      );

      await refreshEvents();
      toast.success(eventForm.id ? "Event updated." : "Event created.");
      closeEventEditor();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save event.",
      );
    } finally {
      setEventsBusy(false);
    }
  }

  async function handleNewsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsBusy(true);

    try {
      await readJson(
        newsForm.id ? `/api/admin/news/${newsForm.id}` : "/api/admin/news",
        {
          method: newsForm.id ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(newsForm),
        },
      );

      await refreshNews();
      toast.success(newsForm.id ? "News item updated." : "News item created.");
      closeNewsEditor();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save news item.",
      );
    } finally {
      setNewsBusy(false);
    }
  }

  async function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDocumentsBusy(true);

    try {
      await readJson(
        documentForm.id
          ? `/api/admin/documents/${documentForm.id}`
          : "/api/admin/documents",
        {
          method: documentForm.id ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(documentForm),
        },
      );

      await refreshDocuments();
      toast.success(
        documentForm.id ? "Document updated." : "Document created.",
      );
      setDocumentForm(emptyDocumentForm());
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save document.",
      );
    } finally {
      setDocumentsBusy(false);
    }
  }

  async function handleEventStatusChange(
    item: AdminEventRecord,
    nextStatus: EventFormState["status"],
  ) {
    if (String(item.status) === nextStatus) {
      return;
    }

    setEventsBusy(true);

    try {
      const payload = {
        ...eventToForm(item),
        status: nextStatus,
      };

      await readJson(`/api/admin/events/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      await refreshEvents();

      if (eventForm.id === item.id) {
        setEventForm((current) => ({
          ...current,
          status: nextStatus,
        }));
      }

      toast.success(
        `Event marked as ${getStatusLabel(Number(nextStatus) as AdminEventRecord["status"]).toLowerCase()}.`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to change event status.",
      );
    } finally {
      setEventsBusy(false);
    }
  }

  async function handleNewsStatusChange(
    item: AdminNewsRecord,
    nextStatus: NewsFormState["status"],
  ) {
    if (String(item.status) === nextStatus) {
      return;
    }

    setNewsBusy(true);

    try {
      const payload = {
        ...newsToForm(item),
        status: nextStatus,
      };

      await readJson(`/api/admin/news/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      await refreshNews();

      if (newsForm.id === item.id) {
        setNewsForm((current) => ({
          ...current,
          status: nextStatus,
        }));
      }

      toast.success(
        `News item marked as ${getStatusLabel(Number(nextStatus) as PublishStatus).toLowerCase()}.`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to change news status.",
      );
    } finally {
      setNewsBusy(false);
    }
  }

  async function handleDocumentDelete(id: string) {
    if (!window.confirm("Delete this document?")) {
      return;
    }

    setDocumentsBusy(true);

    try {
      await readJson(`/api/admin/documents/${id}`, { method: "DELETE" });
      await refreshDocuments();
      if (documentForm.id === id) {
        setDocumentForm(emptyDocumentForm());
      }
      toast.success("Document deleted.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete document.",
      );
    } finally {
      setDocumentsBusy(false);
    }
  }

  async function handleRegistrationStatusChange(
    registrationId: string,
    status: RegistrationStatus,
    feedback?: string,
  ) {
    setRegistrationStatusBusyId(registrationId);

    try {
      const payload = await readJson<{ data: RegistrationRecord }>(
        `/api/admin/registrations/${registrationId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status, feedback: feedback ?? null }),
        },
      );

      setRegistrations((current) =>
        current.map((item) =>
          item.id === registrationId ? payload.data : item,
        ),
      );
      toast.success("Registration status updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update registration status.",
      );
    } finally {
      setRegistrationStatusBusyId(null);
    }
  }

  async function handleMarkRegistrationPaid(registrationId: string) {
    setRegistrationActionBusyKey(`${registrationId}:mark-paid`);

    try {
      const payload = await readJson<{ data: RegistrationRecord }>(
        `/api/admin/registrations/${registrationId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ paymentStatus: "paid" }),
        },
      );

      setRegistrations((current) =>
        current.map((item) =>
          item.id === registrationId ? payload.data : item,
        ),
      );
      toast.success("Payment marked as paid.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update payment status.",
      );
    } finally {
      setRegistrationActionBusyKey(null);
    }
  }

  function openExternalUrl(url: string) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  function downloadRegistrationForm(registration: RegistrationRecord) {
    const blankUrl = getRegistrationBlankUrl(registration);

    if (!blankUrl) {
      toast.error("This form is still being generated.");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = blankUrl;
    anchor.download = `${registration.boat_name ?? "entry"}.pdf`;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  async function handleGeneratePaymentLink(registration: RegistrationRecord) {
    if (!paymentsEnabled) {
      toast.error("Payments are unavailable because myPOS is not configured.");
      return;
    }

    const busyKey = `${registration.id}:payment`;
    setRegistrationActionBusyKey(busyKey);

    try {
      const payload = await readJson<{
        data: { checkoutUrl: string; sessionId: string };
      }>(`/api/registrations/${registration.id}/checkout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale: registration.preferred_language ?? "en",
        }),
      });

      setRegistrations((current) =>
        current.map((item) =>
          item.id === registration.id
            ? {
                ...item,
                payment_data: {
                  ...(item.payment_data && typeof item.payment_data === "object"
                    ? item.payment_data
                    : {}),
                  mypos: {
                    ...(item.payment_data?.mypos ?? {}),
                    order_id: payload.data.sessionId,
                    checkout_url: payload.data.checkoutUrl,
                  },
                },
              }
            : item,
        ),
      );

      openExternalUrl(payload.data.checkoutUrl);
      toast.success("Payment link generated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to generate payment link.",
      );
    } finally {
      setRegistrationActionBusyKey(null);
    }
  }

  async function handleDownloadInsuranceDocuments(
    registration: RegistrationRecord,
  ) {
    const busyKey = `${registration.id}:insurance`;
    setRegistrationActionBusyKey(busyKey);

    try {
      if (registration.insurance_documents.length === 0) {
        toast.error("No insurance documents were uploaded.");
        return;
      }

      for (
        let index = 0;
        index < registration.insurance_documents.length;
        index += 1
      ) {
        const url = registration.insurance_documents[index];
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Unable to download one of the insurance documents.");
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = getFileLabelFromUrl(url);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(objectUrl);

        if (index < registration.insurance_documents.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to download the insurance documents.",
      );
    } finally {
      setRegistrationActionBusyKey(null);
    }
  }

  function getRegistrationBlankUrl(registration: RegistrationRecord) {
    return registration.blank_link ?? registration.generated_form_url ?? null;
  }

  function getRegistrationPayment(registration: RegistrationRecord) {
    return registration.payment_data?.mypos ?? registration.payment_data?.stripe;
  }

  const approvedRegistrations = registrations.filter(
    (registration) => registration.status === "approved",
  );
  const paidRegistrations = registrations.filter(
    (registration) =>
      getRegistrationPayment(registration)?.payment_status === "paid",
  );

  function startBlankDownloads(
    targets: RegistrationRecord[],
    setDownloading: (value: boolean) => void,
  ) {
    const blankTargets = targets.filter((registration) =>
      Boolean(getRegistrationBlankUrl(registration)),
    );

    if (blankTargets.length === 0) {
      toast.error("No generated blanks are ready to download yet.");
      return;
    }

    setDownloading(true);

    void (async () => {
      try {
        for (let index = 0; index < blankTargets.length; index += 1) {
          const registration = blankTargets[index];
          const blankUrl = getRegistrationBlankUrl(registration);

          if (!blankUrl) {
            continue;
          }

          const response = await fetch(blankUrl);

          if (!response.ok) {
            throw new Error("Unable to download one of the blank forms.");
          }

          const blob = await response.blob();
          const objectUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = objectUrl;
          a.download = `${registration.boat_name ?? "entry"}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(objectUrl);

          if (index < blankTargets.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to download the blank forms.",
        );
      } finally {
        setDownloading(false);
      }
    })();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_46%,#ffffff_100%)] px-5 py-6 text-dark md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(23,32,35,0.1)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2  uppercase tracking-[0.32em] text-primary/70">
                Admin area
              </p>
              <h1 className="text-4xl font-semibold md:text-5xl">
                Content management
              </h1>
              <p className="mt-3 max-w-3xl  leading-6 text-dark/65 md:text-base">
                Signed in as <span className="font-semibold">{userEmail}</span>.
                Use the tabs below to manage events, news, and downloadable
                documents stored in Supabase.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={authBusy}
              style={{ color: "white", backgroundColor: "#dc2626" }}
              className="h-11 rounded-xl border-black/10 px-5 text-dark"
            >
              {authBusy ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="events">
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 rounded-[1.25rem] border border-black/10 bg-white/85 p-2">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          {/* ── EVENTS ──────────────────────────────────────────────── */}
          <TabsContent value="events">
            <SectionHeading
              title="Events"
              description="Manage event names, descriptions, status, date range, and supporting files."
            />
            <div className="space-y-4">
              <AddCardButton
                title="Add event"
                description="Create a new regatta, training weekend, or archived event."
                onClick={() => openEventEditor()}
              />

              {events.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white/80 px-5 py-8  text-dark/60">
                  No events yet.
                </div>
              ) : null}

              {events.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[1.5rem] border p-5 shadow-sm transition-colors ${getEventStatusCardClasses(item.status)}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-2xl font-semibold">
                        {item.name_en}
                        <a
                          href={`/en/events/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dark/30 transition-colors hover:text-dark/70"
                          title="Open event in new tab"
                        >
                          <ExternalLink className="h-6 w-6 text-blue-400" />
                        </a>
                      </h3>
                      <p className="mt-1  text-dark/60">
                        {localizeText("bg", item.name_en, item.name_bg)}
                      </p>
                      {/* <p className="mt-2  font-medium uppercase tracking-[0.18em] text-dark/45">
                        /events/{item.slug}
                      </p> */}
                      <div className="mt-3 flex flex-wrap gap-2  text-dark/60">
                        <span className="rounded-full bg-white/70 px-3 py-1">
                          {moment(item.start_date).format("DD-MM-YYYY")} to{" "}
                          {moment(item.end_date).format("DD-MM-YYYY")}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1">
                          {item.total_entries} total entr
                          {item.total_entries === 1 ? "y" : "ies"}
                        </span>
                        {/* <span
                          className={`rounded-full px-3 py-1 font-semibold ${getEventStatusBadgeClasses(item.status)}`}
                        >
                          {getStatusLabel(item.status)}
                        </span> */}
                        {/* <span className="rounded-full bg-white/70 px-3 py-1">
                          {item.documents.length} documents
                        </span> */}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => void openEventEntries(item)}
                        className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
                      >
                        Entries
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openEventDocumentsEditor(item)}
                        className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
                      >
                        Documents
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openEventEditor(eventToForm(item))}
                        className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={eventsBusy}
                        onClick={() =>
                          handleEventStatusChange(item, option.value)
                        }
                        className={`rounded-full border px-3 py-1  font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${getEventStatusButtonClasses(
                          option.value,
                          item.status,
                        )}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4  text-dark/50">
                    Updated {formatTimestamp(item.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── NEWS ────────────────────────────────────────────────── */}
          <TabsContent value="news">
            <SectionHeading
              title="News"
              description="Manage bilingual news entries and attachment files."
            />
            <div className="space-y-4">
              <AddCardButton
                title="Add news post"
                description="Write a blog-style update with formatting, inline images, and auto-collected attachments."
                onClick={() => openNewsEditor()}
              />

              {news.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white/80 px-5 py-8  text-dark/60">
                  No news items yet.
                </div>
              ) : null}

              {news.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[1.5rem] border p-5 shadow-sm transition-colors ${getEventStatusCardClasses(item.status)}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-2xl font-semibold">
                        {item.name_en}
                        <a
                          href={`/en/news/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dark/30 transition-colors hover:text-dark/70"
                          title="Open post in new tab"
                        >
                          <ExternalLink className="h-6 w-6 text-blue-400" />
                        </a>
                      </h3>

                      <p className="mt-1 text-dark/60">
                        {localizeText("bg", item.name_en, item.name_bg)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-dark/60">
                        <span className="rounded-full bg-white/70 px-3 py-1">
                          {item.attachments.length} attachments
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1">
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openNewsEditor(newsToForm(item))}
                        className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={newsBusy}
                        onClick={() => handleNewsStatusChange(item, option.value)}
                        className={`rounded-full border px-3 py-1 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${getEventStatusButtonClasses(
                          option.value,
                          item.status,
                        )}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4  text-dark/50">
                    Updated {formatTimestamp(item.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── DOCUMENTS ───────────────────────────────────────────── */}
          <TabsContent value="documents">
            <SectionHeading
              title="Documents"
              description="Store reusable document entries with bilingual names and an uploaded file."
            />
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                {/* <AddCardButton
                  title="Add document"
                  description="Upload a reusable file with bilingual labels for the public site."
                  onClick={() => setDocumentForm(emptyDocumentForm())}
                /> */}

                {documents.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white/80 px-5 py-8  text-dark/60">
                    No documents yet.
                  </div>
                ) : null}

                {documents.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-black/10 bg-white/90 p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-2xl font-semibold">
                          {item.name_en}
                        </h3>
                        <p className="mt-1  text-dark/60">
                          {localizeText("bg", item.name_en, item.name_bg)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.general_use ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
                              General use
                            </span>
                          ) : (
                            <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-dark/55">
                              Event-specific
                            </span>
                          )}
                        </div>
                        <a
                          href={item.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block break-all  text-primary hover:underline"
                        >
                          {item.source.split("/").pop() || item.source}
                        </a>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDocumentForm(documentToForm(item))}
                          className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          style={{ color: "white", backgroundColor: "#dc2626" }}
                          onClick={() => handleDocumentDelete(item.id)}
                          disabled={documentsBusy}
                          className={`rounded-xl ${interactiveButtonClass}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4  text-dark/50">
                      Updated {formatTimestamp(item.updated_at)}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleDocumentSubmit}
                className="rounded-[1.75rem] border border-black/10 bg-white/95 p-6 shadow-sm"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">
                      {documentForm.id ? "Edit document" : "Create document"}
                    </h3>
                    <p className="mt-1  text-dark/60">
                      Use this for PDFs, notices, or any linked resource.
                    </p>
                  </div>

                  {documentForm.id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDocumentForm(emptyDocumentForm())}
                    >
                      Reset
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  <AdminField
                    label="Name (EN)"
                    value={documentForm.name_en}
                    onChange={(value) =>
                      setDocumentForm((current) => ({
                        ...current,
                        name_en: value,
                      }))
                    }
                    required
                  />
                  <AdminField
                    label="Name (BG, optional)"
                    value={documentForm.name_bg}
                    onChange={(value) =>
                      setDocumentForm((current) => ({
                        ...current,
                        name_bg: value,
                      }))
                    }
                  />
                  <SingleFileUploadField
                    label="File"
                    value={documentForm.source}
                    onChange={(url) =>
                      setDocumentForm((current) => ({
                        ...current,
                        source: url,
                      }))
                    }
                    onError={(msg) => toast.error(msg)}
                    required
                  />
                  <label className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark">
                    <input
                      type="checkbox"
                      checked={documentForm.general_use}
                      onChange={(event) =>
                        setDocumentForm((current) => ({
                          ...current,
                          general_use: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-black/20 text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium">General use document</p>
                      <p className="text-sm text-dark/60">
                        Keep this available as a reusable document across
                        events.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="mt-6">
                  <Button
                    type="submit"
                    disabled={documentsBusy}
                    className="rounded-xl px-5 text-white"
                  >
                    {documentsBusy
                      ? "Saving..."
                      : documentForm.id
                        ? "Update document"
                        : "Create document"}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* ── GALLERY ─────────────────────────────────────────────── */}
          <TabsContent value="gallery">
            <SectionHeading
              title="Gallery"
              description="Photos are pulled from Google Drive. Organise them into year folders (e.g. 2025) inside the gallery folder."
            />
            <div className="rounded-[1.5rem] border border-black/10 bg-white/90 p-6 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Image
                    src="/images/SVGs/google-drive.png"
                    width={100}
                    height={100}
                    className="w-8 h-8"
                    alt="google drive"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark">
                    Google Drive folder
                  </h3>
                  <p className="mt-1  leading-6 text-dark/60">
                    Add or remove photos directly in the Drive folder. Create
                    sub-folders named by year (e.g.{" "}
                    <span className="font-mono font-semibold">2025</span>) —
                    each becomes an accordion section in the gallery. Photos
                    inside are sorted alphabetically by filename.
                  </p>
                </div>
              </div>

              <a
                href={`https://drive.google.com/drive/folders/${process.env.NEXT_PUBLIC_GALLERY_FOLDER_ID || "1L7iALLBsMHbBftZl41NAyr4wwujnxM87"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary px-5 py-4  font-semibold text-white transition-colors hover:bg-primary/90"
              >
                <span className="flex items-center gap-2">
                  <Icon icon="ph:folder-open-bold" width={20} height={20} />
                  Open gallery folder in Google Drive
                </span>
                <Icon icon="ph:arrow-up-right-bold" width={18} height={18} />
              </a>

              <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-4  text-dark/70 space-y-2">
                <p className="font-semibold text-dark">How it works</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Each <strong>year folder</strong> (2024, 2025 …) becomes a
                    tab in the gallery.
                  </li>
                  <li>Folders are shown newest-first.</li>
                  <li>Supported formats: JPEG, PNG, WebP, GIF.</li>
                  <li>
                    Photos refresh every <strong>15 minutes</strong> (cached).
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <AdminModal
          open={eventModalOpen}
          title={eventForm.id ? "Edit event" : "Create event"}
          description="Save bilingual copy and resource files for this event."
          onClose={closeEventEditor}
        >
          <form onSubmit={handleEventSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField
                label="Name (EN)"
                value={eventForm.name_en}
                onChange={(value) =>
                  setEventForm((current) => {
                    const nextSlug =
                      current.id === null &&
                      (!current.slug ||
                        current.slug === slugify(current.name_en))
                        ? slugify(value)
                        : current.slug;

                    return {
                      ...current,
                      name_en: value,
                      slug: nextSlug,
                    };
                  })
                }
                required
              />
              <AdminField
                label="Name (BG, optional)"
                value={eventForm.name_bg}
                onChange={(value) =>
                  setEventForm((current) => ({ ...current, name_bg: value }))
                }
              />
              <div className="md:col-span-2">
                <AdminField
                  label="Slug"
                  value={eventForm.slug}
                  onChange={(value) =>
                    setEventForm((current) => ({
                      ...current,
                      slug: slugify(value),
                    }))
                  }
                  placeholder="regatta-port-bourgas-2026"
                  required
                  disabled={Boolean(eventForm.id)}
                />
              </div>
              <ImageUploadField
                label="Thumbnail image"
                value={eventForm.thumbnail_img}
                onChange={(url) =>
                  setEventForm((current) => ({
                    ...current,
                    thumbnail_img: url,
                  }))
                }
                onError={(msg) => toast.error(msg)}
              />
              <label className="block">
                <span className="mb-2 block  font-medium text-dark">
                  Status
                </span>
                <select
                  value={eventForm.status}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      status: event.target.value as EventFormState["status"],
                    }))
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3  text-dark outline-none transition focus:border-primary"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <AdminDateField
                label="Start date"
                value={eventForm.start_date}
                onChange={(value) =>
                  setEventForm((current) => ({ ...current, start_date: value }))
                }
                required
              />
              <AdminDateField
                label="End date"
                value={eventForm.end_date}
                onChange={(value) =>
                  setEventForm((current) => ({ ...current, end_date: value }))
                }
                required
              />
            </div>

            <div className="mt-4 grid gap-4">
              <AdminTextarea
                label="Description (EN)"
                value={eventForm.description_en}
                onChange={(value) =>
                  setEventForm((current) => ({
                    ...current,
                    description_en: value,
                  }))
                }
              />
              <AdminTextarea
                label="Description (BG, optional)"
                value={eventForm.description_bg}
                onChange={(value) =>
                  setEventForm((current) => ({
                    ...current,
                    description_bg: value,
                  }))
                }
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <EventDocumentReferenceField
                  label="Notice board"
                  values={eventForm.notice_board}
                  documents={documents}
                  allowSelectExistingDocuments
                  onChange={(urls) =>
                    setEventForm((current) => ({
                      ...current,
                      notice_board: urls,
                    }))
                  }
                  onError={(msg) => toast.error(msg)}
                  onDocumentsCreated={addDocumentsToLibrary}
                  onDocumentUpdated={updateDocumentInLibrary}
                  onCreateDocuments={createEventDocuments}
                  onSaveDocument={saveDocumentRecord}
                />
                <EventDocumentReferenceField
                  label="Results"
                  values={eventForm.results}
                  documents={documents}
                  allowSelectExistingDocuments
                  onChange={(values) =>
                    setEventForm((current) => ({ ...current, results: values }))
                  }
                  onError={(msg) => toast.error(msg)}
                  onDocumentsCreated={addDocumentsToLibrary}
                  onDocumentUpdated={updateDocumentInLibrary}
                  onCreateDocuments={createEventDocuments}
                  onSaveDocument={saveDocumentRecord}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button
                type="submit"
                disabled={eventsBusy}
                className="rounded-xl px-5 text-white"
              >
                {eventsBusy
                  ? "Saving..."
                  : eventForm.id
                    ? "Update event"
                    : "Create event"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeEventEditor}
                className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
              >
                Cancel
              </Button>
            </div>
          </form>
        </AdminModal>

        <AdminModal
          open={newsModalOpen}
          title={newsForm.id ? "Edit news item" : "Create news item"}
          description="Write a bilingual news post in the rich text editor. Excerpts are generated automatically from the body."
          onClose={closeNewsEditor}
        >
          <form onSubmit={handleNewsSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField
                label="Name (EN)"
                value={newsForm.name_en}
                onChange={(value) =>
                  setNewsForm((current) => {
                    const nextSlug =
                      !current.slug || current.slug === slugify(current.name_en)
                        ? slugify(value)
                        : current.slug;

                    return {
                      ...current,
                      name_en: value,
                      slug: nextSlug,
                    };
                  })
                }
                required
              />
              <AdminField
                label="Name (BG, optional)"
                value={newsForm.name_bg}
                onChange={(value) =>
                  setNewsForm((current) => ({ ...current, name_bg: value }))
                }
              />
              <div className="md:col-span-2">
                <AdminField
                  label="Slug"
                  value={newsForm.slug}
                  onChange={(value) =>
                    setNewsForm((current) => ({
                      ...current,
                      slug: slugify(value),
                    }))
                  }
                  placeholder="regatta-port-bourgas-2026-announcement"
                  required
                  disabled={Boolean(newsForm.id)}
                />
              </div>
              <label className="block md:col-span-2">
                <span className="mb-2 block font-medium text-dark">Status</span>
                <select
                  value={newsForm.status}
                  onChange={(event) =>
                    setNewsForm((current) => ({
                      ...current,
                      status: event.target.value as NewsFormState["status"],
                    }))
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-dark/55">
                  Hidden news stays in admin but is removed from public news
                  listings and the homepage.
                </p>
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-6">
                <div>
                  <HtmlEditor
                    label="Body (EN)"
                    value={newsForm.body_en}
                    onChange={(value) =>
                      setNewsForm((current) => ({
                        ...current,
                        body_en: value,
                      }))
                    }
                    onError={(msg) => toast.error(msg)}
                  />
                </div>
                <div>
                  <HtmlEditor
                    label="Body (BG, optional)"
                    value={newsForm.body_bg}
                    onChange={(value) =>
                      setNewsForm((current) => ({
                        ...current,
                        body_bg: value,
                      }))
                    }
                    onError={(msg) => toast.error(msg)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button
                type="submit"
                disabled={newsBusy}
                className="rounded-xl px-5 text-white"
              >
                {newsBusy
                  ? "Saving..."
                  : newsForm.id
                    ? "Update news item"
                    : "Create news item"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeNewsEditor}
                className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
              >
                Cancel
              </Button>
            </div>
          </form>
        </AdminModal>

        <AdminModal
          open={entriesModalOpen}
          title={
            activeEntriesEvent
              ? `Entries for ${activeEntriesEvent.name_en}`
              : "Event entries"
          }
          description={
            activeEntriesEvent
              ? "Review submitted registrations, expand an entry to see all boat and contact information, and update its status."
              : "Review submitted registrations for this event."
          }
          onClose={closeEntriesModal}
        >
          {registrationsLoading ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white/80 px-5 py-10  text-dark/60">
              Loading registrations...
            </div>
          ) : registrations.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white/80 px-5 py-10  text-dark/60">
              No registrations have been submitted for this event yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2  text-dark/60">
                <button
                  type="button"
                  onClick={() => setRegistrationStatusFilter(null)}
                  className={`rounded-full px-3 py-1 transition-all ${registrationStatusFilter === null ? "bg-black/20 font-semibold text-dark" : "bg-black/5 hover:bg-black/10"}`}
                >
                  {registrations.length} total entries
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationStatusFilter("pending")}
                  className={`rounded-full px-3 py-1 transition-all ${registrationStatusFilter === "pending" ? "bg-amber-300 font-semibold text-amber-900" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}`}
                >
                  {
                    registrations.filter((item) => item.status === "pending")
                      .length
                  }{" "}
                  pending
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationStatusFilter("approved")}
                  className={`rounded-full px-3 py-1 transition-all ${registrationStatusFilter === "approved" ? "bg-emerald-300 font-semibold text-emerald-900" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"}`}
                >
                  {
                    registrations.filter((item) => item.status === "approved")
                      .length
                  }{" "}
                  approved
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationStatusFilter("rejected")}
                  className={`rounded-full px-3 py-1 transition-all ${registrationStatusFilter === "rejected" ? "bg-red-300 font-semibold text-red-900" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                >
                  {
                    registrations.filter((item) => item.status === "rejected")
                      .length
                  }{" "}
                  rejected
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={downloadingBlanks}
                  onClick={() => {
                    startBlankDownloads(
                      approvedRegistrations,
                      setDownloadingBlanks,
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5  font-medium text-dark shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon icon="ph:file-pdf-bold" width={15} height={15} />
                  Download all approved blanks
                  {downloadingBlanks
                    ? " …"
                    : ` (${approvedRegistrations.length})`}
                </button>
                <button
                  type="button"
                  disabled={downloadingPaidBlanks}
                  onClick={() => {
                    startBlankDownloads(
                      paidRegistrations,
                      setDownloadingPaidBlanks,
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5  font-medium text-dark shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon icon="ph:file-pdf-bold" width={15} height={15} />
                  Download all paid blanks
                  {downloadingPaidBlanks
                    ? " …"
                    : ` (${paidRegistrations.length})`}
                </button>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                {(registrationStatusFilter
                  ? registrations.filter(
                      (r) => r.status === registrationStatusFilter,
                    )
                  : registrations
                ).map((registration) => {
                  const payment = getRegistrationPayment(registration);
                  const isUnpaid = payment?.payment_status !== "paid";
                  const isPaymentActionBusy =
                    registrationActionBusyKey === `${registration.id}:payment`;
                  const isInvoiceActionBusy =
                    registrationActionBusyKey === `${registration.id}:invoice`;
                  const isMarkPaidActionBusy =
                    registrationActionBusyKey ===
                    `${registration.id}:mark-paid`;
                  const isInsuranceActionBusy =
                    registrationActionBusyKey ===
                    `${registration.id}:insurance`;
                  return (
                    <AccordionItem
                      key={registration.id}
                      value={registration.id}
                      className={`overflow-hidden rounded-[1.5rem] border shadow-sm ${
                        isUnpaid
                          ? "border-red-200 bg-red-50/70"
                          : "border-black/10 bg-white/90"
                      }`}
                    >
                      <AccordionTrigger className="items-center bg-white px-5 py-4 hover:no-underline">
                        <div className="flex flex-1 flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-dark">
                              {registration.boat_name}
                            </p>
                            <p className="mt-1  text-dark/60">
                              {registration.skipper_name} •{" "}
                              {registration.country}
                            </p>
                            <p className="mt-1  text-dark/45">
                              {registration.contact_email} • Submitted{" "}
                              {formatTimestamp(registration.created_at)}
                            </p>
                          </div>

                          <div className="flex text-sm flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1  font-semibold ${getRegistrationStatusBadgeClasses(
                                registration.status,
                              )}`}
                            >
                              {registration.status}
                            </span>
                            {/* <span className="rounded-full bg-black/5 px-3 py-1  text-dark/60">
                            {registration.crew_list.length} crew
                          </span> */}
                            {isUnpaid ? (
                              <span className="rounded-full bg-red-100 px-3 py-1  font-semibold text-red-700">
                                Unpaid
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-5 pb-5 text-dark">
                        <div className="space-y-5">
                          {isUnpaid ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3  font-medium text-red-700">
                              Payment has not been completed for this
                              registration yet.
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            {(
                              [
                                "pending",
                                "approved",
                                "rejected",
                              ] as RegistrationStatus[]
                            ).map((status) => (
                              <button
                                key={status}
                                type="button"
                                disabled={
                                  registrationStatusBusyId === registration.id
                                }
                                onClick={() => {
                                  if (status === "rejected") {
                                    setRejectionModal({
                                      registrationId: registration.id,
                                      boatName: registration.boat_name,
                                    });
                                    setRejectionFeedback("");
                                  } else {
                                    void handleRegistrationStatusChange(
                                      registration.id,
                                      status,
                                    );
                                  }
                                }}
                                className={`rounded-full border px-3 py-1  font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${getRegistrationStatusButtonClasses(
                                  status,
                                  registration.status,
                                )}`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                !getRegistrationBlankUrl(registration) ||
                                isPaymentActionBusy ||
                                isInvoiceActionBusy ||
                                isMarkPaidActionBusy ||
                                isInsuranceActionBusy
                              }
                              onClick={() =>
                                downloadRegistrationForm(registration)
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5  font-medium text-dark shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Icon
                                icon="ph:file-pdf-bold"
                                width={15}
                                height={15}
                              />
                              Download form
                            </button>
                            <button
                              type="button"
                              disabled={
                                registration.insurance_documents.length === 0 ||
                                isPaymentActionBusy ||
                                isInvoiceActionBusy ||
                                isMarkPaidActionBusy ||
                                isInsuranceActionBusy
                              }
                              onClick={() => {
                                void handleDownloadInsuranceDocuments(
                                  registration,
                                );
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5  font-medium text-dark shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Icon
                                icon="ph:shield-check-bold"
                                width={15}
                                height={15}
                              />
                              {isInsuranceActionBusy
                                ? "Downloading insurance..."
                                : "Download insurance"}
                            </button>
                            <button
                              type="button"
                              disabled={
                                isUnpaid === false ||
                                !paymentsEnabled ||
                                isPaymentActionBusy ||
                                isInvoiceActionBusy ||
                                isMarkPaidActionBusy ||
                                isInsuranceActionBusy
                              }
                              onClick={() => {
                                void handleGeneratePaymentLink(registration);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5  font-medium text-dark shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Icon
                                icon="ph:credit-card-bold"
                                width={15}
                                height={15}
                              />
                              {isPaymentActionBusy
                                ? "Generating payment link..."
                                : paymentsEnabled
                                  ? "Generate payment link"
                                  : "Payments unavailable"}
                            </button>
                            {isUnpaid ? (
                              <button
                                type="button"
                                disabled={
                                  isPaymentActionBusy ||
                                  isInvoiceActionBusy ||
                                  isMarkPaidActionBusy ||
                                  isInsuranceActionBusy
                                }
                                onClick={() => {
                                  void handleMarkRegistrationPaid(
                                    registration.id,
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5  font-medium text-dark shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Icon
                                  icon="ph:check-circle-bold"
                                  width={15}
                                  height={15}
                                />
                                {isMarkPaidActionBusy
                                  ? "Marking as paid..."
                                  : "Mark as paid"}
                              </button>
                            ) : null}
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <RegistrationDetailRow
                              label="Boat name"
                              value={registration.boat_name}
                            />
                            <RegistrationDetailRow
                              label="Border number"
                              value={formatOptionalValue(
                                registration.border_number,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Country"
                              value={registration.country}
                            />
                            <RegistrationDetailRow
                              label="Model / design"
                              value={registration.model_design}
                            />
                            <RegistrationDetailRow
                              label="Sail number"
                              value={registration.sail_number}
                            />
                            <RegistrationDetailRow
                              label="Boat age"
                              value={registration.boat_age}
                            />
                            <RegistrationDetailRow
                              label="LOA"
                              value={`${registration.loa} m`}
                            />
                            <RegistrationDetailRow
                              label="GPH / IRC"
                              value={registration.gph_irc}
                            />
                            <RegistrationDetailRow
                              label="Boat color"
                              value={formatOptionalValue(
                                registration.boat_color,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Port of registry"
                              value={formatOptionalValue(
                                registration.port_of_registry,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Yacht club"
                              value={formatOptionalValue(
                                registration.yacht_club,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Certificate of navigation"
                              value={formatOptionalValue(
                                registration.certificate_of_navigation,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Certificate of navigation expiry"
                              value={formatOptionalValue(
                                registration.certificate_of_navigation_expiry,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Skipper name"
                              value={registration.skipper_name}
                            />
                            <RegistrationDetailRow
                              label="Skipper yacht club"
                              value={registration.skipper_yacht_club}
                            />
                            <RegistrationDetailRow
                              label="Charterer name"
                              value={formatOptionalValue(
                                registration.charterer_name,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Certificate of competency"
                              value={registration.certificate_of_competency}
                            />
                            <RegistrationDetailRow
                              label="Competency expiry"
                              value={formatOptionalValue(
                                registration.certificate_of_competency_expiry,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Contact name"
                              value={registration.contact_name}
                            />
                            <RegistrationDetailRow
                              label="Contact phone"
                              value={registration.contact_phone}
                            />
                            <RegistrationDetailRow
                              label="Contact email"
                              value={registration.contact_email}
                            />

                            <RegistrationDetailRow
                              label="Payment status"
                              value={formatOptionalValue(payment?.payment_status)}
                            />

                            <RegistrationDetailRow
                              label="Receive documents by email"
                              value={formatBooleanValue(
                                registration.receive_documents_by_email,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Crew insurance"
                              value={formatBooleanValue(
                                registration.crew_insurance,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Third-party insurance"
                              value={formatBooleanValue(
                                registration.third_party_insurance,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Disclaimer accepted"
                              value={formatBooleanValue(
                                registration.disclaimer_accepted,
                              )}
                            />
                            <RegistrationDetailRow
                              label="GDPR accepted"
                              value={formatBooleanValue(
                                registration.gdpr_accepted,
                              )}
                            />
                            <RegistrationDetailRow
                              label="Preferred language"
                              value={registration.preferred_language ?? "en"}
                            />
                            {registration.status === "rejected" ? (
                              <RegistrationDetailRow
                                label="Rejection feedback"
                                value={formatOptionalValue(
                                  registration.rejection_feedback,
                                )}
                              />
                            ) : null}
                          </div>

                          <div className="rounded-[1.25rem] border border-black/10 bg-white/80 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dark/45">
                              Crew list
                            </p>
                            {registration.crew_list.length === 0 ? (
                              <p className="mt-3  text-dark/60">
                                No crew members were added.
                              </p>
                            ) : (
                              <div className="mt-3 space-y-3">
                                {registration.crew_list.map(
                                  (crewMember, index) => (
                                    <div
                                      key={`${registration.id}-crew-${index}`}
                                      className="rounded-2xl border border-black/10 bg-white p-4"
                                    >
                                      <p className=" font-semibold text-dark">
                                        {crewMember.name}
                                      </p>
                                      <div className="mt-2 grid gap-2  text-dark/65 sm:grid-cols-1">
                                        <p>
                                          Date of birth:{" "}
                                          {formatOptionalValue(
                                            crewMember.date_of_birth ?? null,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>

                          <div className="rounded-[1.25rem] border border-black/10 bg-white/80 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dark/45">
                              Insurance documents
                            </p>
                            {registration.insurance_documents.length === 0 ? (
                              <p className="mt-3  text-dark/60">
                                No insurance documents were uploaded.
                              </p>
                            ) : (
                              <div className="mt-3 space-y-3">
                                {registration.insurance_documents.map(
                                  (url, index) => (
                                    <a
                                      key={`${registration.id}-insurance-${index}`}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block rounded-2xl border border-black/10 bg-white p-4  font-medium text-primary hover:underline"
                                    >
                                      {url.split("/").pop() || url}
                                    </a>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </AdminModal>

        <AdminModal
          open={eventDocumentsModalOpen}
          title={
            activeEventDocumentsEvent
              ? `Documents for ${activeEventDocumentsEvent.name_en}`
              : "Event documents"
          }
          description={
            activeEventDocumentsEvent
              ? "Manage the notice board and result documents linked to this event."
              : "Manage event documents."
          }
          onClose={closeEventDocumentsEditor}
        >
          {eventDocumentsForm ? (
            <form onSubmit={handleEventDocumentsSubmit}>
              <Tabs defaultValue="noticeBoard">
                <TabsList className="mb-6">
                  <TabsTrigger value="noticeBoard">Notice board</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>

                <TabsContent value="noticeBoard">
                  <EventDocumentReferenceField
                    label="Notice board documents"
                    values={eventDocumentsForm.notice_board}
                    documents={documents}
                    allowSelectExistingDocuments
                    onChange={(values) =>
                      setEventDocumentsForm((current) =>
                        current
                          ? {
                              ...current,
                              notice_board: values,
                            }
                          : current,
                      )
                    }
                    onReorder={(values) =>
                      autosaveEventDocumentOrder("notice_board", values)
                    }
                    onError={(msg) => toast.error(msg)}
                    onDocumentsCreated={addDocumentsToLibrary}
                    onDocumentUpdated={updateDocumentInLibrary}
                    onCreateDocuments={createEventDocuments}
                    onSaveDocument={saveDocumentRecord}
                  />
                </TabsContent>

                <TabsContent value="results">
                  <EventDocumentReferenceField
                    label="Result documents"
                    values={eventDocumentsForm.results}
                    documents={documents}
                    allowSelectExistingDocuments
                    onChange={(values) =>
                      setEventDocumentsForm((current) =>
                        current
                          ? {
                              ...current,
                              results: values,
                            }
                          : current,
                      )
                    }
                    onReorder={(values) =>
                      autosaveEventDocumentOrder("results", values)
                    }
                    onError={(msg) => toast.error(msg)}
                    onDocumentsCreated={addDocumentsToLibrary}
                    onDocumentUpdated={updateDocumentInLibrary}
                    onCreateDocuments={createEventDocuments}
                    onSaveDocument={saveDocumentRecord}
                  />
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={eventsBusy}
                  className="rounded-xl px-5 text-white"
                >
                  {eventsBusy ? "Saving..." : "Save document changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEventDocumentsEditor}
                  className={`rounded-xl border-black/10 bg-white text-dark ${interactiveButtonClass}`}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </AdminModal>

        {/* Rejection confirmation modal */}
        {rejectionModal ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setRejectionModal(null)}
            />
            <div className="relative w-full max-w-md rounded-[1.5rem] bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-dark">
                Reject registration
              </h3>
              <p className="mt-2 text-dark/60">
                You are about to reject the entry for{" "}
                <strong>{rejectionModal.boatName}</strong>. The entrant will
                receive an email notification.
              </p>
              <div className="mt-4">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-dark/45">
                  Feedback for the entrant{" "}
                  <span className="normal-case tracking-normal text-dark/30">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={rejectionFeedback}
                  onChange={(e) => setRejectionFeedback(e.target.value)}
                  placeholder="Explain why the registration is being rejected…"
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-black/15 bg-black/[0.02] px-4 py-3 text-dark placeholder:text-dark/30 focus:border-black/30 focus:outline-none"
                />
              </div>
              <div className="mt-5 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRejectionModal(null)}
                  className="flex-1 rounded-xl border-black/10"
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    registrationStatusBusyId === rejectionModal.registrationId
                  }
                  onClick={() => {
                    const { registrationId } = rejectionModal;
                    setRejectionModal(null);
                    void handleRegistrationStatusChange(
                      registrationId,
                      "rejected",
                      rejectionFeedback.trim() || undefined,
                    );
                  }}
                  className="flex-1 rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm rejection
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
