import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, // ✅ IMPORTANTE
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Save, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export interface FormField {
  key: string;
  label: string;
  type:
  | "text"
  | "email"
  | "password"
  | "number"
  | "date"
  | "datetime"
  | "textarea"
  | "select"
  | "boolean"
  | "hidden"
  | "color";
  required?: boolean;
  placeholder?: string;
  options?: { value: any; label: string }[];
  coerceToNumber?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  disabled?: boolean;
  readonly?: boolean;
  helpText?: string;
  nameAttr?: string; // opcional para submit nativo
}

export interface GenericFormProps {
  title: string;
  fields: FormField[];
  initialData?: any;
  loading?: boolean;
  onSubmit(data: any): void;
  onCancel(): void;
  submitLabel?: string;
  cancelLabel?: string;
  errors?: Record<string, string>;
  success?: boolean;
  successMessage?: string;
  validateAsyncMap?: Record<
    string,
    (value: any, formData: any) => Promise<string | null>
  >;
  extraContent?: React.ReactNode;
}

export function GenericForm({
  title,
  fields,
  initialData = {},
  loading = false,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  errors = {},
  success = false,
  successMessage = "Datos guardados correctamente",
  validateAsyncMap = {},
  extraContent,
}: GenericFormProps) {
  const [formData, setFormData] = useState<any>(initialData);
  const [validationErrors, setValidationErrors] =
    useState<Record<string, string>>({});
  const debounceRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (value === null || value === undefined || value === "")) {
      return `${field.label} es requerido`;
    }
    if (field.validation && value !== null && value !== undefined && value !== "") {
      const { min, max, pattern, message } = field.validation;
      if (typeof value === "number") {
        if (min !== undefined && value < min) {
          return message || `${field.label} debe ser mayor o igual a ${min}`;
        }
        if (max !== undefined && value > max) {
          return message || `${field.label} debe ser menor o igual a ${max}`;
        }
      }
      if (pattern && !pattern.test(String(value))) {
        return message || `${field.label} tiene un formato inválido`;
      }
    }
    return null;
  };

  const runAsyncValidation = (key: string, value: any, nextData: any) => {
    const validator = validateAsyncMap[key];
    if (!validator) return;
    if (debounceRefs.current[key]) clearTimeout(debounceRefs.current[key]);
    debounceRefs.current[key] = setTimeout(async () => {
      const msg = await validator(value, nextData);
      setValidationErrors((prev) => {
        const next = { ...prev } as Record<string, string>;
        if (msg) next[key] = msg;
        else delete next[key];
        return next;
      });
    }, 300);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const error = validateField(field, formData[field.key]);
      if (error) newErrors[field.key] = error;
    });
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    runAsyncValidation(key, value, { ...formData, [key]: value });
  };

  const normalizeDateValue = (field: FormField, raw: any) => {
    let value = raw ?? "";
    if ((field.type === "date" || field.type === "datetime") && value) {
      if (value instanceof Date) {
        value =
          field.type === "date"
            ? value.toISOString().split("T")[0]
            : value.toISOString().slice(0, 16);
      } else if (typeof value === "string") {
        if (field.type === "date") value = value.split("T")[0];
        else if (value.includes("T")) value = value.slice(0, 16);
      }
    }
    return value;
  };

  const renderField = (field: FormField) => {
    const baseId = field.key;
    const labelId = `${baseId}-label`;
    const testId = `select-${field.key}`;

    let value = normalizeDateValue(field, formData?.[field.key]);
    const error = validationErrors[field.key] || errors[field.key];
    const hasError = !!error;

    if (field.type === "hidden") {
      return (
        <input
          key={field.key}
          type="hidden"
          value={value}
          name={field.nameAttr ?? field.key}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
        />
      );
    }

    return (
      <div key={field.key} className="space-y-2">
        <Label id={labelId} htmlFor={baseId} className={hasError ? "text-red-600" : ""}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {field.type === "textarea" ? (
          <Textarea
            id={baseId}
            value={value ?? ""}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            readOnly={field.readonly}
            className={hasError ? "border-red-500" : ""}
            name={field.nameAttr ?? field.key}
          />
        ) : field.type === "select" ? (
          <Select
            value={value !== "" && value !== null && value !== undefined ? String(value) : undefined}
            onValueChange={(newValue) => handleInputChange(field.key, field.coerceToNumber ? Number(newValue) : newValue)}
          >
            <SelectTrigger
              id={baseId}
              aria-labelledby={labelId}
              className={hasError ? "border-red-500" : ""}
              disabled={field.disabled}
              data-testid={testId}
              name={field.nameAttr ?? field.key}
            >
              {(() => {
                const opts = field.options || [];
                const selected = opts.find(o => String(o.value) === String(value));
                return selected ? (
                  <span>{selected.label}</span>
                ) : (
                  <SelectValue placeholder={field.placeholder ?? "Seleccionar"} />
                );
              })()}
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "boolean" ? (
          <div className="flex items-center space-x-2">
            <Switch
              id={baseId}
              checked={!!value}
              onCheckedChange={(checked) => handleInputChange(field.key, checked)}
              disabled={field.disabled}
              name={field.nameAttr ?? field.key}
            />
            <Label htmlFor={baseId} className="text-sm">
              {value ? "Sí" : "No"}
            </Label>
          </div>
        ) : (
          <Input
            id={baseId}
            type={field.type}
            value={value ?? ""}
            onChange={(e) => {
              const v =
                field.type === "number" && e.target.value !== ""
                  ? Number(e.target.value)
                  : e.target.value;
              handleInputChange(field.key, v);
            }}
            placeholder={field.placeholder}
            disabled={field.disabled}
            readOnly={field.readonly}
            className={hasError ? "border-red-500" : ""}
            min={field.validation?.min}
            max={field.validation?.max}
            name={field.nameAttr ?? field.key}
          />
        )}

        {field.helpText && <p className="text-sm text-gray-500">{field.helpText}</p>}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto-inyectar campo oculto 'version' para optimistic locking si no está declarado */}
            {(() => {
              const hasVersionField = fields.some(f => f.key === 'version');
              const autoFields = hasVersionField || formData?.version === undefined
                ? fields
                : [...fields, { key: 'version', label: 'version', type: 'hidden' as const }];
              return autoFields.map((field) => (
                <div
                  key={field.key}
                  className={field.type === "textarea" ? "md:col-span-2" : ""}
                >
                  {renderField(field)}
                </div>
              ));
            })()}
          </div>

          {extraContent}

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <LoadingOverlay size="sm" fullScreen={false} />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
