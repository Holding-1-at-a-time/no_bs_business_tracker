"use client";

import { useState, useEffect, type ComponentPropsWithoutRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

/**
 * Generic reusable form dialog component
 * Handles form state, validation, submission, and error handling
 *
 * @example
 * ```tsx
 * <FormDialog
 *   title="Add New Item"
 *   schema={mySchema}
 *   defaultValues={{ name: "", email: "" }}
 *   onSubmit={async (values) => await addItem(values)}
 *   successMessage="Item added successfully!"
 *   triggerButton={<Button>Add Item</Button>}
 *   formFields={(form) => (
 *     <>
 *       <FormField control={form.control} name="name" ... />
 *       <FormField control={form.control} name="email" ... />
 *     </>
 *   )}
 * />
 * ```
 */
export function FormDialog<TSchema extends z.ZodType>({
    title,
    description,
    schema,
    defaultValues,
    onSubmit,
    successMessage,
    triggerButton,
    formFields, // Pass the form object to the render function
    submitLabel = "Save",
    isEdit = false,
    onOpenChange,
}: {
    /** Dialog title */
    title: string;
    /** Optional dialog description */
    description?: string;
    /** Zod schema for validation */
    schema: TSchema;
    /** Default form values */
    defaultValues: z.infer<TSchema>;
    /** Submit handler (can be async) */
    onSubmit: (values: z.infer<TSchema>) => Promise<void> | void;
    /** Success toast message */
    successMessage?: string;
    /** Trigger button element */
    triggerButton: React.ReactElement<ComponentPropsWithoutRef<"button">>;
    /** Render function for form fields */
    formFields: (form: UseFormReturn<z.infer<TSchema>>) => React.ReactNode;
    /** Custom submit button label */
    submitLabel?: string;
    /** Whether this is an edit dialog (controls reset behavior) */
    isEdit?: boolean;
    /** Optional callback when dialog open state changes */
    onOpenChange?: (open: boolean) => void;
}) {
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<TSchema>>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues]);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (onOpenChange) onOpenChange(newOpen);

        // Reset form when closing
        if (!newOpen) {
            form.reset(defaultValues);
        }
    };

    const handleSubmit = async (values: z.infer<TSchema>) => {
        try {
            await onSubmit(values);

            if (successMessage) {
                toast.success(successMessage);
            }

            // Reset form for add dialogs, keep values for edit dialogs
            if (!isEdit) { 
                form.reset(defaultValues);
            }

            setOpen(false);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Something went wrong"
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {formFields(form)}
                        <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                            className="w-full"
                        >
                            {form.formState.isSubmitting ? "Saving..." : submitLabel}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Convenience wrapper for "Add" dialogs
 * Automatically sets isEdit=false and uses "Add" in messages
 */
export function AddFormDialog<TSchema extends z.ZodType>(
    props: Omit<React.ComponentProps<typeof FormDialog<TSchema>>, "isEdit">
) {
    return <FormDialog {...props} isEdit={false} />;
}

/**
 * Convenience wrapper for "Edit" dialogs
 * Automatically sets isEdit=true and uses "Update" in messages
 */
export function EditFormDialog<TSchema extends z.ZodType>(
    props: Omit<React.ComponentProps<typeof FormDialog<TSchema>>, "isEdit" | "submitLabel">
) {
    return <FormDialog {...props} isEdit={true} submitLabel="Update" />;
}
