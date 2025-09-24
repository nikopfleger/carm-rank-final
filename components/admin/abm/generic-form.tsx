import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  Save,
  X
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime' | 'textarea' | 'select' | 'boolean' | 'hidden' | 'color';
  required?: boolean;
  placeholder?: string;
  options?: { value: any; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  disabled?: boolean;
  readonly?: boolean;
  helpText?: string;
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
  validateAsyncMap?: Record<string, (value: any, formData: any) => Promise<string | null>>;
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const debounceRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (value === null || value === undefined || value === '')) {
      return `${field.label} es requerido`;
    }
    if (field.validation && value) {
      const { min, max, pattern, message } = field.validation;
      if (min !== undefined && value < min) {
        return message || `${field.label} debe ser mayor o igual a ${min}`;
      }
      if (max !== undefined && value > max) {
        return message || `${field.label} debe ser menor o igual a ${max}`;
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
        if (msg) next[key] = msg; else delete next[key];
        return next;
      });
    }, 300);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const error = validateField(field, formData[field.key]);
      if (error) {
        newErrors[field.key] = error;
      }
    });
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev: any) => {
      const next = { ...prev, [key]: value };
      return next;
    });
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
    runAsyncValidation(key, value, { ...formData, [key]: value });
  };

  const renderField = (field: FormField) => {
    let value = formData?.[field.key] ?? '';

    // Convertir fechas al formato correcto para inputs de tipo date/datetime
    if ((field.type === 'date' || field.type === 'datetime') && value) {
      if (value instanceof Date) {
        if (field.type === 'date') {
          value = value.toISOString().split('T')[0];
        } else {
          // Para datetime, mantener formato YYYY-MM-DDTHH:mm
          value = value.toISOString().slice(0, 16);
        }
      } else if (typeof value === 'string' && value.includes('T')) {
        if (field.type === 'date') {
          value = value.split('T')[0];
        } else {
          // Para datetime, asegurar formato correcto
          value = value.slice(0, 16);
        }
      }
    }

    const error = validationErrors[field.key] || errors[field.key];
    const hasError = !!error;

    if (field.type === 'hidden') {
      return (
        <input
          type="hidden"
          value={value}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
        />
      );
    }

    const selectedLabel = field.type === 'select'
      ? field.options?.find((o) => String(o.value) === String(value))?.label
      : undefined;

    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key} className={hasError ? 'text-red-600' : ''}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.type === 'textarea' ? (
          <Textarea
            id={field.key}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            readOnly={field.readonly}
            className={hasError ? 'border-red-500' : ''}
          />
        ) : field.type === 'select' ? (
          <Select
            value={value ? String(value) : undefined}
            onValueChange={(newValue) => handleInputChange(field.key, newValue)}
          >
            <SelectTrigger
              className={hasError ? 'border-red-500' : ''}
              disabled={field.disabled}
            >
              <span>{selectedLabel || field.placeholder || 'Seleccionar'}</span>
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'boolean' ? (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.key}
              checked={!!value}
              onCheckedChange={(checked) => handleInputChange(field.key, checked)}
              disabled={field.disabled}
            />
            <Label htmlFor={field.key} className="text-sm">
              {value ? 'Sí' : 'No'}
            </Label>
          </div>
        ) : (
          <Input
            id={field.key}
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            readOnly={field.readonly}
            className={hasError ? 'border-red-500' : ''}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )}
        {field.helpText && (
          <p className="text-sm text-gray-500">{field.helpText}</p>
        )}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                {renderField(field)}
              </div>
            ))}
          </div>

          {extraContent}

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingOverlay size="sm" fullScreen={false} /> : <Save className="w-4 h-4 mr-2" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
