// file: app/(app)/scripts/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Suspense, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Doc, Id } from "../../../convex/_generated/dataModel";";
import { toast } from "sonner"; // Assuming you have sonner for toasts

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Edit, Trash, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Need this for "Pro" badge

// Zod schemas for forms
const scriptSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Script content is required"),
});
type ScriptFormValues = z.infer<typeof scriptSchema>;

const handlerSchema = z.object({
    objection: z.string().min(1, "Objection is required"),
    response: z.string().min(1, "Response is required"),
});
type HandlerFormValues = z.infer<typeof handlerSchema>;

// --- Scripts Section ---
function ScriptsSection({
    scripts,
    plan,
}: {
    scripts: Doc<"scripts">[];
    plan: string;
}) {
    const [isAddOpen, setAddOpen] = useState(false);
    const addScript = useMutation(api.scripts.addScript);
    const isAtLimit = plan !== "pro" && scripts.length >= 3;

    const handleAdd = async (values: ScriptFormValues) {
        try {
            await addScript(values);
            setAddOpen(false);
            toast.success("Script added!");
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Customer Approach Scripts</CardTitle>
                    <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={isAtLimit}>
                                {isAtLimit && <Sparkles className="mr-2 h-4 w-4" />}
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Script
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Script</DialogTitle></DialogHeader>
                            <ScriptForm onSubmit={handleAdd} />
                        </DialogContent>
                    </Dialog>
                </div>
                <CardDescription>
                    Your saved scripts for in-person, phone, or text.
                    {isAtLimit && (
                        <span className="text-orange-600 font-medium ml-2">
                            Free plan limit reached. Upgrade to add more.
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {scripts.map((script) => (
                    <ScriptCard key={script._id} script={script} />
                ))}
            </CardContent>
        </Card>
    );
}

function ScriptCard({ script }: { script: Doc<"scripts"> }) {
    const [isEditOpen, setEditOpen] = useState(false);
    const updateScript = useMutation(api.scripts.updateScript);
    const deleteScript = useMutation(api.scripts.deleteScript);

    const handleUpdate = async (values: ScriptFormValues) {
        try {
            await updateScript({ scriptId: script._id, ...values });
            setEditOpen(false);
            toast.success("Script updated!");
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this script?")) {
            try {
                await deleteScript({ scriptId: script._id });
                toast.success("Script deleted.");
            } catch (error) {
                toast.error((error as Error).message);
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{script.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {script.content}
                </p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
                <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit Script</DialogTitle></DialogHeader>
                        <ScriptForm onSubmit={handleUpdate} defaultValues={script} />
                    </DialogContent>
                </Dialog>
                <Button variant="destructive-outline" size="sm" onClick={handleDelete}>
                    <Trash className="mr-2 h-4 w-4" /> Delete
                </Button>
            </CardFooter>
        </Card>
    );
}

function ScriptForm({
    onSubmit,
    defaultValues,
}: {
    onSubmit: (values: ScriptFormValues) => void;
    defaultValues?: ScriptFormValues;
}) {
    const form = useForm<ScriptFormValues>({
        resolver: zodResolver(scriptSchema),
        defaultValues: defaultValues ?? { title: "", content: "" },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl><Input placeholder="e.g., In-Person Script" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl><Textarea rows={8} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Save Script"}
                </Button>
            </form>
        </Form>
    );
}

// --- Objection Handlers Section ---
function HandlersSection({
    handlers,
    plan,
}: {
    handlers: Doc<"objectionHandlers">[];
    plan: string;
}) {
    const [isAddOpen, setAddOpen] = useState(false);
    const addHandler = useMutation(api.scripts.addObjectionHandler);
    const isAtLimit = plan !== "pro" && handlers.length >= 5;

    const handleAdd = async (values: HandlerFormValues) {
        try {
            await addHandler(values);
            setAddOpen(false);
            toast.success("Handler added!");
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Objection Handlers</CardTitle>
                    <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={isAtLimit}>
                                {isAtLimit && <Sparkles className="mr-2 h-4 w-4" />}
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Handler
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Handler</DialogTitle></DialogHeader>
                            <HandlerForm onSubmit={handleAdd} />
                        </DialogContent>
                    </Dialog>
                </div>
                <CardDescription>
                    Your pre-written responses to common customer objections.
                    {isAtLimit && (
                        <span className="text-orange-600 font-medium ml-2">
                            Free plan limit reached. Upgrade to add more.
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Objection</TableHead>
                            <TableHead>My Response</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {handlers.map((handler) => (
                            <HandlerRow key={handler._id} handler={handler} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function HandlerRow({ handler }: { handler: Doc<"objectionHandlers"> }) {
    const [isEditOpen, setEditOpen] = useState(false);
    const updateHandler = useMutation(api.scripts.updateObjectionHandler);
    const deleteHandler = useMutation(api.scripts.deleteObjectionHandler);

    const handleUpdate = async (values: HandlerFormValues) {
        try {
            await updateHandler({ handlerId: handler._id, ...values });
            setEditOpen(false);
            toast.success("Handler updated!");
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this handler?")) {
            try {
                await deleteHandler({ handlerId: handler._id });
                toast.success("Handler deleted.");
            } catch (error) {
                toast.error((error as Error).message);
            }
        }
    };

    return (
        <TableRow>
            <TableCell className="font-medium">{handler.objection}</TableCell>
            <TableCell className="text-muted-foreground">{handler.response}</TableCell>
            <TableCell className="text-right space-x-2">
                <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit Handler</DialogTitle></DialogHeader>
                        <HandlerForm onSubmit={handleUpdate} defaultValues={handler} />
                    </DialogContent>
                </Dialog>
                <Button variant="destructive-outline" size="sm" onClick={handleDelete}>
                    <Trash className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
}

function HandlerForm({
    onSubmit,
    defaultValues,
}: {
    onSubmit: (values: HandlerFormValues) => void;
    defaultValues?: HandlerFormValues;
}) {
    const form = useForm<HandlerFormValues>({
        resolver: zodResolver(handlerSchema),
        defaultValues: defaultValues ?? { objection: "", response: "" },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="objection"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Objection</FormLabel>
                            <FormControl><Input placeholder="e.g., 'Too expensive'" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="response"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>My Response</FormLabel>
                            <FormControl><Textarea rows={4} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Save Handler"}
                </Button>
            </form>
        </Form>
    );
}

// --- Main Page Component ---
function ScriptsPage() {
    const data = useQuery(api.scripts.getScriptsAndHandlers);

    if (data === undefined) {
        return <div>Loading scripts...</div>; // TODO: Skeleton
    }
    if (data === null) {
        return <div>Error loading data.</div>;
    }

    const { scripts, objectionHandlers, plan } = data;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Scripts & Resources</h1>
            <ScriptsSection scripts={scripts} plan={plan} />
            <HandlersSection handlers={objectionHandlers} plan={plan} />
        </div>
    );
}

export default function ScriptsPageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ScriptsPage />
        </Suspsponse>
    );
}