import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  labelClassName?: string;
  error?: string | boolean;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  inputSize?: InputSize;
}

const sizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-4 py-3.5 text-base rounded-xl",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      labelClassName,
      error,
      helperText,
      startIcon,
      endIcon,
      inputSize = "md",
      id: customId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const isError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "block text-xs font-bold uppercase tracking-wider text-quizlet-slate-secondary mb-1.5 select-none",
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-quizlet-slate-muted">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={isError ? "true" : undefined}
            aria-describedby={
              errorMessage ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            className={cn(
              "w-full bg-white text-quizlet-slate placeholder-quizlet-slate-muted border-2 transition-all duration-150 outline-none",
              "hover:border-quizlet-border-hover",
              "focus:border-quizlet-indigo focus:ring-4 focus:ring-quizlet-indigo/15",
              "disabled:bg-quizlet-canvas disabled:text-quizlet-slate-muted disabled:cursor-not-allowed disabled:border-quizlet-border",
              isError
                ? "border-quizlet-coral focus:border-quizlet-coral focus:ring-4 focus:ring-quizlet-coral/15"
                : "border-quizlet-border",
              sizeStyles[inputSize],
              startIcon && "pl-10",
              endIcon && "pr-10",
              className
            )}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3.5 flex items-center text-quizlet-slate-muted">
              {endIcon}
            </div>
          )}
        </div>
        {errorMessage && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-1.5 text-xs font-medium text-quizlet-coral flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{errorMessage}</span>
          </p>
        )}
        {!errorMessage && helperText && (
          <p id={`${id}-helper`} className="mt-1.5 text-xs text-quizlet-slate-secondary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
