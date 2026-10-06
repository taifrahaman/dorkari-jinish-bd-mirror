// src/components/admin/product-import/ImportWizard.tsx

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step1UploadCsv } from "./steps/Step1UploadCsv";
import { Step2UploadImages } from "./steps/Step2UploadImages";
import { Step3MatchImages } from "./steps/Step3MatchImages";
import { Step4Review } from "./steps/Step4Review";
import { useImportStore, type WizardStep } from "./useImportStore";

/* ============================================================
 * Step definitions
 * ============================================================ */

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 1, label: "Upload CSV" },
  { id: 2, label: "Upload images" },
  { id: 3, label: "Match images" },
  { id: 4, label: "Review & import" },
];

/* ============================================================
 * Component
 * ============================================================ */

export function ImportWizard() {
  const step = useImportStore((s) => s.step);

  return (
    <div className="space-y-6">
      <Stepper current={step} />

      <div>
        {step === 1 && <Step1UploadCsv />}
        {step === 2 && <Step2UploadImages />}
        {step === 3 && <Step3MatchImages />}
        {step === 4 && <Step4Review />}
      </div>
    </div>
  );
}

export default ImportWizard;

/* ============================================================
 * Stepper
 * ============================================================ */

function Stepper({ current }: { current: WizardStep }) {
  return (
    <nav aria-label="Import steps">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {STEPS.map((s, i) => {
          const isActive = s.id === current;
          const isComplete = s.id < current;

          return (
            <li key={s.id} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums",
                    isActive && "bg-brand-primary text-white",
                    isComplete && "bg-brand-accent text-brand-primary",
                    !isActive &&
                      !isComplete &&
                      "border border-brand-border bg-brand-surface text-brand-text-secondary",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isComplete ? (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    s.id
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive
                      ? "text-brand-primary"
                      : isComplete
                        ? "text-brand-primary"
                        : "text-brand-text-secondary",
                  )}
                >
                  {s.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "hidden h-px w-8 sm:block",
                    s.id < current ? "bg-brand-accent" : "bg-brand-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
