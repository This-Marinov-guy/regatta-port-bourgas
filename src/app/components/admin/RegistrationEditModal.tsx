"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { Button } from "@/app/components/ui/button";
import type { CrewMember, RegistrationRecord } from "@/types/admin";

export type RegistrationEditableFields = {
  boat_name: string;
  border_number: string;
  country: string;
  certificate_of_navigation: string;
  certificate_of_navigation_expiry: string;
  model_design: string;
  sail_number: string;
  boat_age: string;
  port_of_registry: string;
  gph_irc: string;
  loa: string;
  boat_color: string;
  yacht_club: string;
  skipper_name: string;
  skipper_yacht_club: string;
  charterer_name: string;
  certificate_of_competency: string;
  certificate_of_competency_expiry: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  receive_documents_by_email: boolean;
  crew_insurance: boolean;
  third_party_insurance: boolean;
  disclaimer_accepted: boolean;
  gdpr_accepted: boolean;
  crew_list: CrewMember[];
};

type Props = {
  registration: RegistrationRecord | null;
  saving: boolean;
  onClose: () => void;
  onSave: (fields: RegistrationEditableFields) => Promise<void>;
};

const inputClassName =
  "block w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-black/5";

function textValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function dateValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function toEditableFields(registration: RegistrationRecord): RegistrationEditableFields {
  return {
    boat_name: registration.boat_name,
    border_number: textValue(registration.border_number),
    country: registration.country,
    certificate_of_navigation: textValue(registration.certificate_of_navigation),
    certificate_of_navigation_expiry: dateValue(
      registration.certificate_of_navigation_expiry,
    ),
    model_design: registration.model_design,
    sail_number: registration.sail_number,
    boat_age: textValue(registration.boat_age),
    port_of_registry: textValue(registration.port_of_registry),
    gph_irc: registration.gph_irc,
    loa: textValue(registration.loa),
    boat_color: textValue(registration.boat_color),
    yacht_club: textValue(registration.yacht_club),
    skipper_name: registration.skipper_name,
    skipper_yacht_club: registration.skipper_yacht_club,
    charterer_name: textValue(registration.charterer_name),
    certificate_of_competency: registration.certificate_of_competency,
    certificate_of_competency_expiry: dateValue(
      registration.certificate_of_competency_expiry,
    ),
    contact_name: registration.contact_name,
    contact_phone: registration.contact_phone,
    contact_email: registration.contact_email,
    receive_documents_by_email: registration.receive_documents_by_email,
    crew_insurance: registration.crew_insurance,
    third_party_insurance: registration.third_party_insurance,
    disclaimer_accepted: registration.disclaimer_accepted,
    gdpr_accepted: registration.gdpr_accepted,
    crew_list:
      registration.crew_list.length > 0
        ? registration.crew_list.map((member) => ({
            name: member.name ?? "",
            date_of_birth: dateValue(member.date_of_birth),
          }))
        : [{ name: registration.skipper_name, date_of_birth: "" }],
  };
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
          portalId="registration-edit-datepicker-portal"
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border border-black/10 bg-black/[0.02] p-4 sm:p-5">
      <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark/45">
        {title}
      </h4>
      {children}
    </section>
  );
}

export default function RegistrationEditModal({
  registration,
  saving,
  onClose,
  onSave,
}: Props) {
  const [fields, setFields] = useState<RegistrationEditableFields | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setFields(registration ? toEditableFields(registration) : null);
    setError("");
  }, [registration]);

  if (!registration || !fields) {
    return null;
  }

  function updateField<K extends keyof RegistrationEditableFields>(
    key: K,
    value: RegistrationEditableFields[K],
  ) {
    setFields((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateCrewMember(index: number, key: keyof CrewMember, value: string) {
    setFields((current) => {
      if (!current) return current;
      return {
        ...current,
        crew_list: current.crew_list.map((member, memberIndex) =>
          memberIndex === index ? { ...member, [key]: value } : member,
        ),
      };
    });
  }

  function updateSkipperName(value: string) {
    setFields((current) => {
      if (!current) return current;
      const crewList =
        current.crew_list.length > 0
          ? current.crew_list.map((member, index) =>
              index === 0 ? { ...member, name: value } : member,
            )
          : [{ name: value, date_of_birth: "" }];
      return { ...current, skipper_name: value, crew_list: crewList };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!fields) {
      return;
    }

    try {
      await onSave(fields);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save registration.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/45 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-8">
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border border-black/10 bg-white shadow-2xl sm:max-h-[calc(100vh-4rem)] sm:rounded-[1.75rem]">
        <div className="shrink-0 p-4 pb-0 sm:p-6 sm:pb-0 md:p-8 md:pb-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-dark sm:text-2xl">Edit entry</h3>
              <p className="mt-1 text-sm leading-6 text-dark/60">
                Update the submitted boat, skipper, contact, crew and declaration fields.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon icon="ph:x-bold" width={22} height={22} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pt-0 sm:p-6 sm:pt-0 md:p-8 md:pt-0">
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
                <div key={`edit-crew-${index}`} className="rounded-2xl border border-black/10 bg-white p-4">
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

          {error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>

          <div className="flex shrink-0 flex-wrap justify-center gap-3 border-t border-black/10 bg-white px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              aria-label={saving ? "Saving changes" : undefined}
              className="rounded-xl bg-primary px-5 text-white hover:bg-primary/90"
            >
              {saving ? (
                <Icon icon="ph:spinner-gap-bold" width={18} height={18} className="animate-spin" aria-hidden="true" />
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
