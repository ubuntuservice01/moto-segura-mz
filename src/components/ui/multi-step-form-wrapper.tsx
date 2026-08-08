import React from "react";
import { Check, ChevronLeft, ChevronRight, Save } from "lucide-react";

export interface StepItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface MultiStepFormWrapperProps {
  steps: StepItem[];
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
  onNextStep?: () => boolean | Promise<boolean>;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  children: React.ReactNode;
}

export function MultiStepFormWrapper({
  steps,
  currentStep,
  onStepChange,
  onNextStep,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Guardar Registo",
  children,
}: MultiStepFormWrapperProps) {
  const totalSteps = steps.length;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = async () => {
    if (onNextStep) {
      const isValid = await onNextStep();
      if (!isValid) return;
    }
    if (!isLastStep) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicador de Progresso & Stepper Topo */}
      <div className="mg-card p-4 sm:p-5 shadow-sm space-y-4">
        {/* Topo com percentagem */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-primary font-bold">
            Etapa {currentStep + 1} de {totalSteps} — {steps[currentStep]?.title}
          </span>
          <span className="text-muted-foreground font-mono">
            {progressPercent}% concluído
          </span>
        </div>

        {/* Barra de Progresso Animada */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepper Visual Horizontal */}
        <div className="hidden sm:flex items-center justify-between pt-1 overflow-x-auto gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <React.Fragment key={step.id || idx}>
                {idx > 0 && (
                  <div
                    className={`h-[2px] flex-1 min-w-[20px] transition-colors duration-300 ${
                      idx <= currentStep ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
                <button
                  type="button"
                  disabled={idx > currentStep}
                  onClick={() => {
                    if (idx < currentStep) onStepChange(idx);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isCompleted
                      ? "bg-success/15 text-success hover:bg-success/20 cursor-pointer"
                      : isCurrent
                      ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                      : "bg-muted/50 text-muted-foreground/60 cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                      isCompleted
                        ? "bg-success text-white"
                        : isCurrent
                        ? "bg-primary-foreground text-primary"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : idx + 1}
                  </span>
                  <span className="whitespace-nowrap truncate max-w-[120px]">
                    {step.title}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Etapa Atual */}
      <div key={currentStep} className="animate-fade-in transition-all duration-300">
        {children}
      </div>

      {/* Controlos de Navegação */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isFirstStep || isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            Continuar
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-success px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-success/90 disabled:opacity-50 transition-all"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "A guardar..." : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
