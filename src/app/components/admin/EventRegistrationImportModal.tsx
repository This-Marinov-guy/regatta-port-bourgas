"use client";

import type { ChangeEvent, DragEvent, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { Button } from "@/app/components/ui/button";
import type { RegistrationEditableFields } from "@/app/components/admin/RegistrationEditModal";
import type { AdminEventRecord, CrewMember, RegistrationRecord } from "@/types/admin";

type ImportResponse = {
  data: {
    editableFields: RegistrationEditableFields;
    notes: string[];
  };
};

type CreateResponse = {
  data: RegistrationRecord;
};

type Props = {
  event: AdminEventRecord | null;
  open: boolean;
  onClose: () => void;
  onCreated: (registration: RegistrationRecord) => void;
};

const inputClassName =
  "block w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-black/5";

function emptyFields(): RegistrationEditableFields {
  return {
    boat_name: "",
    border_number: "",
    country: "",
    certificate_of_navigation: "",
    certificate_of_navigation_expiry: "",
    model_design: "",
    sail_number: "",
    boat_age: "",
    port_of_registry: "",
    gph_irc: "",
    loa: "",
    boat_color: "",
    yacht_club: "",
    skipper_name: "",
    skipper_yacht_club: "",
    charterer_name: "",
    certificate_of_competency: "",
    certificate_of_competency_expiry: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    receive_documents_by_email: true,
    crew_insurance: false,
    third_party_insurance: false,
    disclaimer_accepted: false,
    gdpr_accepted: false,
    crew_list: [{ name: "", date_of_birth: "" }],
  };
}

async function readJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload as T;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  step,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-dark">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        min={min}
        className={inputClassName}
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = value
    ? (() => {
        const [year, month, day] = value.split("-").map(Number);
        return year && month && day ? new Date(year, month - 1, day) : null;
      })()
    : null;

  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-dark">{label}</span>
      <div className="relative">
        <DatePicker
          selected={selected}
          onChange={(date) =>
            onChange(
              date
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                : "",
            )
          }
          dateFormat="dd-MM-yyyy"
          placeholderText="Select date"
          className={`${inputClassName} pr-12`}
          calendarClassName="event-registration-datepicker"
          popperClassName="event-registration-datepicker-popper"
          popperProps={{ strategy: "fixed" }}
          portalId="event-registration-import-datepicker-portal"
          wrapperClassName="w-full"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary">
          <Icon icon="ph:calendar-blank-bold" width={18} height={18} />
        </span>
      </div>
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-black/10 bg-black/[0.02] p-4 sm:p-5">
      <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark/45">
        {title}
      </h4>
      {children}
    </section>
  );
}

export default function EventRegistrationImportModal({
  event,
  open,
  onClose,
  onCreated,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<RegistrationEditableFields>(emptyFields);
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [insuranceDocuments, setInsuranceDocuments] = useState<string[]>([]);
  const [insuranceUploading, setInsuranceUploading] = useState(false);
  const [insuranceDragging, setInsuranceDragging] = useState(false);
  const [insuranceUploadError, setInsuranceUploadError] = useState("");
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setFiles([]);
      setDragging(false);
      setExtracting(false);
      setSaving(false);
      setFields(emptyFields());
      setNotes([]);
      setError("");
      setInsuranceDocuments([]);
      setInsuranceUploading(false);
      setInsuranceDragging(false);
      setInsuranceUploadError("");
    }
  }, [open]);

  if (!open || !event) {
    return null;
  }

  const activeEvent = event;

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    setFiles((current) => {
      const next = [...current];
      Array.from(fileList).forEach((file) => {
        if (!next.some((item) => item.name === file.name && item.size === file.size)) {
          next.push(file);
        }
      });
      return next.slice(0, 8);
    });
    setError("");
  }

  function updateField<K extends keyof RegistrationEditableFields>(
    key: K,
    value: RegistrationEditableFields[K],
  ) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function updateCrewMember(index: number, key: keyof CrewMember, value: string) {
    setFields((current) => ({
      ...current,
      crew_list: current.crew_list.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [key]: value } : member,
      ),
    }));
  }

  function updateSkipperName(value: string) {
    setFields((current) => {
      const crewList =
        current.crew_list.length > 0
          ? current.crew_list.map((member, index) =>
              index === 0 ? { ...member, name: value } : member,
            )
          : [{ name: value, date_of_birth: "" }];

      return { ...current, skipper_name: value, crew_list: crewList };
    });
  }

  function handleSkipExtraction() {
    setError("");
    setFields(emptyFields());
    setNotes([]);
    setStep(2);
  }

  async function uploadInsuranceDocument(file: File) {
    const formData = new FormData();
    formData.set("event_id", activeEvent.id);
    formData.set("file", file);

    const payload = await readJson<{ data?: { url?: string } }>(
      "/api/registrations/upload-insurance",
      {
        method: "POST",
        body: formData,
      },
    );

    if (!payload.data?.url) {
      throw new Error("Unable to upload the insurance document.");
    }

    return payload.data.url;
  }

  async function handleInsuranceFiles(fileList: FileList | null) {
    if (!fileList?.length || insuranceUploading) {
      return;
    }

    setInsuranceUploading(true);
    setInsuranceUploadError("");

    try {
      const uploadedUrls = await Promise.all(
        Array.from(fileList).map((file) => uploadInsuranceDocument(file)),
      );

      setInsuranceDocuments((current) => [
        ...current,
        ...uploadedUrls.filter((url) => !current.includes(url)),
      ]);
    } catch (uploadError) {
      setInsuranceUploadError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the insurance document.",
      );
    } finally {
      setInsuranceUploading(false);
    }
  }

  async function handleExtract() {
    if (files.length === 0) {
      setError("Upload at least one registration file.");
      return;
    }

    setExtracting(true);
    setError("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const payload = await readJson<ImportResponse>(
        `/api/admin/events/${activeEvent.id}/registration-import`,
        {
          method: "POST",
          body: formData,
        },
      );

      setFields({
        ...emptyFields(),
        ...payload.data.editableFields,
        crew_list:
          payload.data.editableFields.crew_list.length > 0
            ? payload.data.editableFields.crew_list
            : [{ name: payload.data.editableFields.skipper_name, date_of_birth: "" }],
      });
      setNotes(payload.data.notes);
      setStep(2);
    } catch (extractError) {
      setError(
        extractError instanceof Error
          ? extractError.message
          : "Unable to extract registration fields.",
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = await readJson<CreateResponse>("/api/admin/registrations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: activeEvent.id,
          editableFields: {
            ...fields,
            insurance_documents: insuranceDocuments,
          },
        }),
      });

      onCreated(payload.data);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save imported registration.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDrop(dropEvent: DragEvent<HTMLDivElement>) {
    dropEvent.preventDefault();
    setDragging(false);
    addFiles(dropEvent.dataTransfer.files);
  }

  function handleFileInput(changeEvent: ChangeEvent<HTMLInputElement>) {
    addFiles(changeEvent.target.files);
    changeEvent.target.value = "";
  }

  return (
    <div data-modal-root className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/45 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-8">
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border border-black/10 bg-white shadow-2xl sm:max-h-[calc(100vh-4rem)] sm:rounded-[1.75rem]">
        <div className="shrink-0 p-4 pb-0 sm:p-6 sm:pb-0 md:p-8 md:pb-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-dark sm:text-2xl">
                Import registration
              </h3>
              <p className="mt-1 text-sm leading-6 text-dark/60">
                {activeEvent.name_en} - upload the signed form, then review the extracted fields.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={extracting || saving}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon icon="ph:x-bold" width={22} height={22} />
            </button>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {([
              { number: 1, label: "Upload files" },
              { number: 2, label: "Review fields" },
            ] as const).map((item) => (
              <button
                type="button"
                key={item.number}
                onClick={() => setStep(item.number)}
                disabled={extracting || saving}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  step === item.number
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-black/10 bg-black/[0.02] text-left text-dark/45 hover:border-primary/40 hover:text-primary"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Step {item.number}: {item.label}
              </button>
            ))}
          </div>
        </div>

        {step === 1 ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-0 sm:p-6 sm:pt-0 md:p-8 md:pt-0">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-[1.5rem] border-2 border-dashed px-5 py-8 transition ${
                dragging ? "border-primary bg-primary/5" : "border-black/10 bg-white/80"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon icon="ph:upload-simple-bold" width={28} height={28} />
                </div>
                <p className="text-lg font-semibold text-dark">
                  Upload images or files of the registration
                </p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-dark/60">
                  Supported files: PDF, TXT, JPG, PNG, GIF and WebP. You can upload
                  up to 8 files, 12 MB each.
                </p>
                <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                  Choose files
                  <input
                    type="file"
                    multiple
                    accept="application/pdf,text/plain,image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileInput}
                    disabled={extracting}
                  />
                </label>
              </div>
            </div>

            {files.length > 0 ? (
              <div className="mt-5 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-dark">{file.name}</p>
                      <p className="text-xs text-dark/50">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      disabled={extracting}
                      className="shrink-0 text-sm font-semibold text-red-500 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipExtraction}
                disabled={extracting}
                className="rounded-xl border-primary bg-white text-primary hover:bg-primary/5 hover:text-primary"
              >
                Skip - fill in manually
              </Button>
              <Button
                type="button"
                onClick={() => void handleExtract()}
                disabled={extracting || files.length === 0}
                className="rounded-xl bg-primary px-5 text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {extracting ? (
                  <Icon icon="ph:spinner-gap-bold" width={18} height={18} className="animate-spin" />
                ) : (
                  "Extract fields"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pt-0 sm:p-6 sm:pt-0 md:p-8 md:pt-0">
              {notes.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-semibold">Extraction notes</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <Section title="Boat information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Boat name" value={fields.boat_name} onChange={(value) => updateField("boat_name", value)} required />
                  <Field label="Border number" value={fields.border_number} onChange={(value) => updateField("border_number", value)} type="number" min="1" step="1" />
                  <Field label="Country" value={fields.country} onChange={(value) => updateField("country", value)} required />
                  <Field label="Certificate of navigation" value={fields.certificate_of_navigation} onChange={(value) => updateField("certificate_of_navigation", value)} type="number" min="1" step="1" />
                  <DateField label="Navigation certificate expiry" value={fields.certificate_of_navigation_expiry} onChange={(value) => updateField("certificate_of_navigation_expiry", value)} />
                  <Field label="Model / design" value={fields.model_design} onChange={(value) => updateField("model_design", value)} required />
                  <Field label="Sail number" value={fields.sail_number} onChange={(value) => updateField("sail_number", value)} required />
                  <Field label="Boat age / year" value={fields.boat_age} onChange={(value) => updateField("boat_age", value)} type="number" min="1" step="1" required />
                  <Field label="Port of registry" value={fields.port_of_registry} onChange={(value) => updateField("port_of_registry", value)} />
                  <Field label="GPH / IRC" value={fields.gph_irc} onChange={(value) => updateField("gph_irc", value)} required />
                  <Field label="LOA (m)" value={fields.loa} onChange={(value) => updateField("loa", value)} type="number" min="0.01" step="0.01" required />
                  <Field label="Boat color" value={fields.boat_color} onChange={(value) => updateField("boat_color", value)} />
                  <Field label="Yacht club" value={fields.yacht_club} onChange={(value) => updateField("yacht_club", value)} />
                </div>
              </Section>

              <Section title="Skipper information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Skipper name" value={fields.skipper_name} onChange={updateSkipperName} required />
                  <Field label="Skipper yacht club" value={fields.skipper_yacht_club} onChange={(value) => updateField("skipper_yacht_club", value)} required />
                  <Field label="Charterer name" value={fields.charterer_name} onChange={(value) => updateField("charterer_name", value)} />
                  <Field label="Certificate of competency" value={fields.certificate_of_competency} onChange={(value) => updateField("certificate_of_competency", value)} required />
                  <DateField label="Competency certificate expiry" value={fields.certificate_of_competency_expiry} onChange={(value) => updateField("certificate_of_competency_expiry", value)} />
                </div>
              </Section>

              <Section title="Contact person">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Contact name" value={fields.contact_name} onChange={(value) => updateField("contact_name", value)} required />
                  <Field label="Contact phone" value={fields.contact_phone} onChange={(value) => updateField("contact_phone", value)} type="tel" required />
                  <div className="sm:col-span-2">
                    <Field label="Contact email" value={fields.contact_email} onChange={(value) => updateField("contact_email", value)} type="email" required />
                  </div>
                </div>
              </Section>

              <Section title="Crew list">
                <div className="space-y-3">
                  {fields.crew_list.map((member, index) => (
                    <div key={`import-crew-${index}`} className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-dark">
                          {index === 0 ? "Skipper" : `Crew member #${index}`}
                        </p>
                        {index > 0 ? (
                          <button
                            type="button"
                            onClick={() => updateField("crew_list", fields.crew_list.filter((_, memberIndex) => memberIndex !== index))}
                            className="text-sm font-semibold text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name" value={member.name} onChange={(value) => updateCrewMember(index, "name", value)} required={index === 0} />
                        <DateField label="Date of birth" value={member.date_of_birth ?? ""} onChange={(value) => updateCrewMember(index, "date_of_birth", value)} />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateField("crew_list", [...fields.crew_list, { name: "", date_of_birth: "" }])}
                  className="mt-4 rounded-xl border-black/10"
                >
                  <Icon icon="ph:plus-bold" width={15} height={15} />
                  Add crew member
                </Button>
              </Section>

              <Section title="Insurance documents">
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-dark/60">
                    Upload any insurance documents supplied with the registration. This is optional.
                  </p>
                  <input
                    ref={insuranceInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(changeEvent) => {
                      void handleInsuranceFiles(changeEvent.target.files);
                      changeEvent.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => insuranceInputRef.current?.click()}
                    onDragOver={(dragEvent) => {
                      dragEvent.preventDefault();
                      if (!insuranceUploading) setInsuranceDragging(true);
                    }}
                    onDragLeave={() => setInsuranceDragging(false)}
                    onDrop={(dropEvent) => {
                      dropEvent.preventDefault();
                      setInsuranceDragging(false);
                      void handleInsuranceFiles(dropEvent.dataTransfer.files);
                    }}
                    disabled={insuranceUploading || saving}
                    className={`w-full rounded-[1.5rem] border-2 border-dashed px-4 py-7 text-left transition ${
                      insuranceDragging
                        ? "border-primary bg-primary/5"
                        : "border-black/10 bg-white/80 hover:border-primary/50"
                    } ${insuranceUploading ? "cursor-progress" : "cursor-pointer"}`}
                  >
                    <span className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        {insuranceUploading ? (
                          <Icon icon="ph:spinner-gap-bold" width={22} height={22} className="animate-spin" />
                        ) : (
                          <Icon icon="ph:upload-simple-bold" width={22} height={22} />
                        )}
                      </span>
                      <span>
                        <span className="block font-semibold text-dark">
                          {insuranceUploading ? "Uploading insurance documents..." : "Add insurance documents"}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-dark/60">
                          Drop files here or choose from your device. PDF, office documents, text files, and images up to 3 MB.
                        </span>
                      </span>
                    </span>
                  </button>
                  {insuranceUploadError ? (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {insuranceUploadError}
                    </p>
                  ) : null}
                  {insuranceDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {insuranceDocuments.map((url, index) => (
                        <div key={`${url}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-sm font-medium text-primary hover:underline">
                            {url.split("/").pop() || url}
                          </a>
                          <button
                            type="button"
                            onClick={() => setInsuranceDocuments((current) => current.filter((_, documentIndex) => documentIndex !== index))}
                            disabled={insuranceUploading || saving}
                            className="shrink-0 text-sm font-semibold text-red-500 hover:underline disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Section>

              {error ? (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-black/10 bg-white px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={saving}
                className="rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary px-5 text-white hover:bg-primary/90"
              >
                {saving ? (
                  <Icon icon="ph:spinner-gap-bold" width={18} height={18} className="animate-spin" />
                ) : (
                  "Save registration"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
