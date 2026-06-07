"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  CITIES,
  DESTINATION_CITY_CODES,
  LOUNGE_TYPES,
  SERVICE_TYPES,
  VEHICLES,
  getCity,
  getStep,
  serviceHasCar,
  type StepType,
} from "@/lib/domain";
import { useJourneyStore } from "@/store/journeyStore";
import { validateStep } from "@/lib/validation/journey";
import { FieldWrap, Select, TextArea, TextInput } from "@/components/ui/Field";
import { ValidationList } from "./ValidationList";
import type { JourneyStepInput } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

export function StepForm({ stepType }: { stepType: StepType }) {
  const { t, pick, locale } = useI18n();
  const step = useJourneyStore((s) => s.steps.find((x) => x.stepType === stepType));
  const update = useJourneyStore((s) => s.updateStep);

  const def = getStep(stepType);
  const result = useMemo(() => (step ? validateStep(step) : null), [step]);
  if (!step) return null;

  const f = def.features;
  const hasCar = serviceHasCar(step.serviceType);
  const set = (patch: Partial<JourneyStepInput>) => update(stepType, patch);

  // City options depend on the step's scope.
  const cityOptions =
    def.cityScope === "RIYADH"
      ? CITIES.filter((c) => c.code === "RUH")
      : def.cityScope === "DESTINATION"
        ? CITIES.filter((c) => (DESTINATION_CITY_CODES as readonly string[]).includes(c.code))
        : CITIES;

  const selectedCity = step.city ? getCity(step.city) : undefined;

  const errFor = (field: string) =>
    result?.errors.find((e) => e.field === field)?.[locale === "ar" ? "messageAr" : "messageEn"];

  return (
    <div className="space-y-5">
      {/* Service type */}
      <FieldWrap label={pick(t.builder.serviceType)}>
        <div className="flex flex-wrap gap-2">
          {SERVICE_TYPES.filter((s) => s.type !== "SKIP")
            .filter((s) => (f.transfer ? true : !s.hasCar || s.type === "MEET_ASSIST_CAR"))
            .map((s) => (
              <button
                key={s.type}
                type="button"
                onClick={() => set({ serviceType: s.type })}
                className={`badge border px-3 py-1.5 transition ${
                  step.serviceType === s.type
                    ? "border-gold bg-gold-50 text-gold-dark"
                    : "border-charcoal/15 text-charcoal/60 hover:border-gold/40"
                }`}
              >
                {pick(s.name)}
              </button>
            ))}
        </div>
      </FieldWrap>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* City */}
        {(f.transfer || f.assistance || f.chauffeur) && (
          <FieldWrap label={pick(t.fields.city)} error={errFor("city")}>
            <Select
              value={step.city ?? ""}
              invalid={!!errFor("city")}
              onChange={(e) => set({ city: e.target.value || undefined, airport: undefined, terminal: undefined })}
              disabled={def.cityScope === "RIYADH"}
            >
              <option value="">{pick(t.common.select)}</option>
              {cityOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {pick(c.name)}
                </option>
              ))}
            </Select>
          </FieldWrap>
        )}

        {/* Airport */}
        {(f.assistance || (f.transfer && def.cityScope === "DESTINATION")) && selectedCity && (
          <FieldWrap label={pick(t.fields.airport)} error={errFor("airport")}>
            <Select
              value={step.airport ?? ""}
              invalid={!!errFor("airport")}
              onChange={(e) => set({ airport: e.target.value || undefined, terminal: undefined })}
            >
              <option value="">{pick(t.common.select)}</option>
              {selectedCity.airports.map((a) => (
                <option key={a.code} value={a.code}>
                  {pick(a.name)} ({a.code})
                </option>
              ))}
            </Select>
          </FieldWrap>
        )}

        {/* Terminal */}
        {f.assistance && step.airport && (
          <FieldWrap label={pick(t.fields.terminal)} optional={pick(t.common.optional)}>
            <Select value={step.terminal ?? ""} onChange={(e) => set({ terminal: e.target.value || undefined })}>
              <option value="">{pick(t.common.select)}</option>
              {(selectedCity?.airports.find((a) => a.code === step.airport)?.terminals ?? []).map((tm) => (
                <option key={tm} value={tm}>
                  {tm}
                </option>
              ))}
            </Select>
          </FieldWrap>
        )}

        {/* Lounge / assistance */}
        {f.assistance && step.serviceType !== "CAR_ONLY" && (
          <FieldWrap label={pick(t.fields.loungeType)} error={errFor("loungeType")}>
            <Select value={step.loungeType ?? ""} onChange={(e) => set({ loungeType: e.target.value || undefined })}>
              <option value="">{pick(t.common.select)}</option>
              {LOUNGE_TYPES.map((l) => (
                <option key={l.value} value={l.value}>
                  {pick(l.name)}
                </option>
              ))}
            </Select>
          </FieldWrap>
        )}

        {/* Flight number */}
        {f.flight && (
          <FieldWrap
            label={pick(t.fields.flightNumber)}
            optional={pick(t.common.optional)}
            error={errFor("flightNumber")}
          >
            <TextInput
              value={step.flightNumber ?? ""}
              invalid={!!errFor("flightNumber")}
              placeholder="SV021"
              onChange={(e) => set({ flightNumber: e.target.value.toUpperCase() || undefined })}
            />
          </FieldWrap>
        )}
      </div>

      {/* Date / time */}
      {f.chauffeur ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrap label={pick(t.fields.startDate)} error={errFor("date")}>
            <TextInput type="date" min={today()} value={step.date ?? ""} invalid={!!errFor("date")} onChange={(e) => set({ date: e.target.value })} />
          </FieldWrap>
          <FieldWrap label={pick(t.fields.endDate)} error={errFor("endDate")}>
            <TextInput type="date" min={step.date ?? today()} value={step.endDate ?? ""} invalid={!!errFor("endDate")} onChange={(e) => set({ endDate: e.target.value })} />
          </FieldWrap>
          <FieldWrap label={pick(t.fields.days)} error={errFor("days")}>
            <TextInput type="number" min={1} max={60} value={step.days ?? ""} invalid={!!errFor("days")} onChange={(e) => set({ days: Number(e.target.value) || undefined })} />
          </FieldWrap>
          <FieldWrap label={pick(t.fields.dailyHours)} error={errFor("dailyHours")}>
            <TextInput type="number" min={1} max={24} value={step.dailyHours ?? ""} invalid={!!errFor("dailyHours")} onChange={(e) => set({ dailyHours: Number(e.target.value) || undefined })} />
          </FieldWrap>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrap label={pick(t.fields.date)} error={errFor("date")}>
            <TextInput type="date" min={today()} value={step.date ?? ""} invalid={!!errFor("date")} onChange={(e) => set({ date: e.target.value })} />
          </FieldWrap>
          <FieldWrap label={pick(t.fields.time)} error={errFor("time")}>
            <TextInput type="time" value={step.time ?? ""} invalid={!!errFor("time")} onChange={(e) => set({ time: e.target.value })} />
          </FieldWrap>
        </div>
      )}

      {/* Locations */}
      {f.home && (
        <FieldWrap label={pick(t.fields.homeAddress)} error={errFor("homeAddress")} optional={pick(t.common.optional)}>
          <TextInput value={step.homeAddress ?? ""} onChange={(e) => set({ homeAddress: e.target.value })} />
        </FieldWrap>
      )}
      {f.hotel && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrap label={pick(t.fields.hotelName)} error={errFor("hotelName")}>
            <TextInput value={step.hotelName ?? ""} onChange={(e) => set({ hotelName: e.target.value })} placeholder={locale === "ar" ? "ابحث أو اكتب اسم الفندق" : "Search or type hotel name"} />
          </FieldWrap>
          <FieldWrap label={pick(t.fields.hotelAddress)} optional={pick(t.common.optional)}>
            <TextInput value={step.hotelAddress ?? ""} onChange={(e) => set({ hotelAddress: e.target.value })} />
          </FieldWrap>
        </div>
      )}

      {/* Transfer: vehicle + pax + bags */}
      {f.transfer && hasCar && (
        <>
          <FieldWrap label={pick(t.fields.carCategory)} error={errFor("carCategory")}>
            <div className="grid gap-2 sm:grid-cols-3">
              {VEHICLES.map((v) => (
                <button
                  key={v.category}
                  type="button"
                  onClick={() => set({ carCategory: v.category })}
                  className={`rounded-xl border p-3 text-start transition ${
                    step.carCategory === v.category
                      ? "border-gold bg-gold-50"
                      : "border-charcoal/15 hover:border-gold/40"
                  }`}
                >
                  <span className="block text-sm font-semibold text-charcoal">{pick(v.name)}</span>
                  <span className="block text-[0.7rem] text-charcoal/50">{v.exampleModels}</span>
                  <span className="mt-1 block text-[0.7rem] text-charcoal/40">
                    {locale === "ar" ? `حتى ${v.maxPassengers}` : `Up to ${v.maxPassengers}`}
                  </span>
                </button>
              ))}
            </div>
          </FieldWrap>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label={pick(t.fields.passengers)} error={errFor("passengers")}>
              <TextInput type="number" min={1} max={20} value={step.passengers ?? ""} invalid={!!errFor("passengers")} onChange={(e) => set({ passengers: Number(e.target.value) || undefined })} />
            </FieldWrap>
            <FieldWrap label={pick(t.fields.bags)}>
              <TextInput type="number" min={0} max={50} value={step.bags ?? ""} onChange={(e) => set({ bags: Number(e.target.value) || 0 })} />
            </FieldWrap>
          </div>
        </>
      )}

      {/* Notes */}
      <FieldWrap label={pick(t.fields.notes)} optional={pick(t.common.optional)}>
        <TextArea value={step.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} />
      </FieldWrap>

      {/* Live validation */}
      {result && (result.errors.length > 0 || result.warnings.length > 0) && (
        <ValidationList issues={[...result.errors, ...result.warnings]} />
      )}
    </div>
  );
}
