"use client";

import type { Control } from "react-hook-form";

import { FieldMessage } from "@/components/common/field-message";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { JobFormValues } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type KeysOfType<T> = { [K in keyof JobFormValues]: JobFormValues[K] extends T ? K : never }[keyof JobFormValues];

interface BaseProps<T> {
  control: Control<JobFormValues>;
  name: KeysOfType<T>;
  label: string;
  hint?: string;
}

export function TextField({
  type = "text",
  autoComplete,
  ...props
}: BaseProps<string> & { type?: string; autoComplete?: string }) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{props.label}</FormLabel>
          <FormControl>
            <Input type={type} autoComplete={autoComplete} {...field} />
          </FormControl>
          {props.hint && <FormDescription>{props.hint}</FormDescription>}
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}

export function TextAreaField(props: BaseProps<string>) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{props.label}</FormLabel>
          <FormControl>
            <Textarea rows={3} className="font-mono text-sm" {...field} />
          </FormControl>
          {props.hint && <FormDescription>{props.hint}</FormDescription>}
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}

export function SwitchField({ danger, ...props }: BaseProps<boolean> & { danger?: boolean }) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start gap-3 space-y-0">
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className={cn(danger && field.value && "text-destructive")}>
              {props.label}
            </FormLabel>
            {props.hint && <FormDescription>{props.hint}</FormDescription>}
          </div>
        </FormItem>
      )}
    />
  );
}
