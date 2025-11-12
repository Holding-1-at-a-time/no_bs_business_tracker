// file: app/(app)/pipeline/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Suspense, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Doc, Id }../../../ convex / _generated / dataModel";
import { toast } from "sonner";

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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

const getToday = () => new Date().toISOString().split("T")[0];

// --- Zod Schemas ---
const addLeadSchema = z.object({
    name: z.string().min(2, "Name is required"),
    contact: z.string().optional(),
    serviceInterest: z.string().min(2, "Service interest is required"),
    source: z.string().optional(),
    nextAction: z.string().optional(),
});
type AddLeadFormValues = z.infer<typeof addLeadSchema>;

const addFollowUpSchema = z.object({
    customerName: z.string().min(1, "Name required"),
    lastContact: z.string().min(1, "Date required"),
    reason: z.string().min(1, "Reason required"),
    followUpDate: z.string().min(1, "Date required"),
    notes: z.string().optional(),
});
type AddFollowUpFormValues = z.infer<typeof addFollowUpSchema>;

const addCustomerSchema = z.object({
    name: z.string().min(1, "Name required"),
    contact: z.string().optional(),
    firstJobDate: z.string().min(1, "Date required"),
});
type AddCustomerFormValues = z.infer<typeof addCustomerSchema>;

// --- Leads Tab ---
function LeadsTab({ leads }: { leads: Doc<"leads">[] }) {
    const [open, setOpen] = useState(false);
    const addLead = useMutation(api.customers.addLead);

    const form = useForm<AddLeadFormValues>({
        resolver: zodResolver(addLeadSchema),
        defaultValues: { name: "", contact: "", serviceInterest: "", source: "", nextAction: "" },
    });

    async function onSubmit(values: AddLeadFormValues) {
        try {
            await addLead({
                ...values,
                contact: values.contact ?? "",
                source: values.source ?? "",
                nextAction: values.nextAction ?? "",
                dateAdded: getToday(),
                status: "New",
            });
            form.reset();
            setOpen(false);
            toast.success("Lead added!");
        } catch (error) {
            toast.error((error as Error).message);
        }
    }

    return (
        <TabsContent value="leads" className="mt-4">
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-end mb-4">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Lead</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        {/* Form Fields */}
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="contact" render={({ field }) => (<FormItem><FormLabel>Phone / Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="serviceInterest" render={({ field }) => (<FormItem><FormLabel>Service Interest</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="source" render={({ field }) => (<FormItem><FormLabel>Source</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="nextAction" render={({ field }) => (<FormItem><FormLabel>Next Action</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <Button type="submit" disabled={form.formState.isSubmitting}>Save Lead</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Service</TableHead><TableHead>Status</TableHead><TableHead>Next Action</TableHead><TableHead>Added</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {leads.map((lead) => (
                                <TableRow key={lead._id}>
                                    <TableCell>{lead.name}</TableCell><TableCell>{lead.contact}</TableCell><TableCell>{lead.serviceInterest}</TableCell>
                                    <TableCell><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">{lead.status}</span></TableCell>
                                    <TableCell>{lead.nextAction}</TableCell><TableCell>{lead.dateAdded}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {leads.length === 0 && <p className="text-muted-foreground text-center p-4">No active leads found.</p>}
                </CardContent>
            </Card>
        </TabsContent>
    );
}

// --- Follow-Ups Tab ---
function FollowUpsTab({ followUps }: { followUps: Doc<"followUps">[] }) {
    const [open, setOpen] = useState(false);
    const addFollowUp = useMutation(api.customers.addFollowUp);

    const form = useForm<AddFollowUpFormValues>({
        resolver: zodResolver(addFollowUpSchema),
        defaultValues: { customerName: "", lastContact: getToday(), reason: "", followUpDate: getToday(), notes: "" },
    });

    async function onSubmit(values: AddFollowUpFormValues) {
        try {
            await addFollowUp({ ...values, notes: values.notes ?? "" });
            form.reset();
            setOpen(false);
            toast.success("Follow-up added!");
        } catch (error) {
            toast.error((error as Error).message);
        }
    }

    return (
        <TabsContent value="followups" className="mt-4">
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-end mb-4">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Follow-Up</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add Follow-Up</DialogTitle></DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="lastContact" render={({ field }) => (<FormItem><FormLabel>Last Contact</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="reason" render={({ field }) => (<FormItem><FormLabel>Reason</FormLabel><FormControl><Input placeholder="e.g., Quote, Check-in" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="followUpDate" render={({ field }) => (<FormItem><FormLabel>Follow-Up Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <Button type="submit" disabled={form.formState.isSubmitting}>Save Follow-Up</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Last Contact</TableHead><TableHead>Reason</TableHead><TableHead>Follow-Up On</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {followUps.map((fu) => (
                                <TableRow key={fu._id}>
                                    <TableCell>{fu.customerName}</TableCell><TableCell>{fu.lastContact}</TableCell><TableCell>{fu.reason}</TableCell><TableCell>{fu.followUpDate}</TableCell><TableCell>{fu.notes}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {followUps.length === 0 && <p className="text-muted-foreground text-center p-4">No follow-ups needed.</p>}
                </CardContent>
            </Card>
        </TabsContent>
    );
}

// --- Customers Tab ---
function CustomersTab({ customers }: { customers: Doc<"customers">[] }) {
    const [open, setOpen] = useState(false);
    const addCustomer = useMutation(api.customers.addCustomer);

    const form = useForm<AddCustomerFormValues>({
        resolver: zodResolver(addCustomerSchema),
        defaultValues: { name: "", contact: "", firstJobDate: getToday() },
    });

    async function onSubmit(values: AddCustomerFormValues) {
        try {
            await addCustomer({ ...values, contact: values.contact ?? "" });
            form.reset();
            setOpen(false);
            toast.success("Customer added!");
        } catch (error) {
            toast.error((error as Error).message);
        }
    }

    return (
        <TabsContent value="customers" className="mt-4">
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-end mb-4">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Customer</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="contact" render={({ field }) => (<FormItem><FormLabel>Phone / Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="firstJobDate" render={({ field }) => (<FormItem><FormLabel>First Job Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <Button type="submit" disabled={form.formState.isSubmitting}>Save Customer</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Total Jobs</TableHead><TableHead>Total Revenue</TableHead><TableHead>Last Job</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {customers.map((c) => (
                                <TableRow key={c._id}>
                                    <TableCell>{c.name}</TableCell><TableCell>{c.contact}</TableCell><TableCell>{c.totalJobs}</TableCell><TableCell>{formatCurrency(c.totalRevenue)}</TableCell><TableCell>{c.lastJobDate}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {customers.length === 0 && <p className="text-muted-foreground text-center p-4">No active customers.</p>}
                </CardContent>
            </Card>
        </TabsContent>
    );
}

// --- Main Page Component ---
function PipelinePage() {
    const pipelineData = useQuery(api.customers.getPipeline);

    if (pipelineData === undefined) return <div>Loading pipeline...</div>;
    if (pipelineData === null) return <div>Loading...</div>;

    const { leads, followUps, customers } = pipelineData;

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Customer Pipeline</h1>
            <Tabs defaultValue="leads" className="w-full">
                <TabsList>
                    <TabsTrigger value="leads">Active Leads ({leads.length})</TabsTrigger>
                    <TabsTrigger value="followups">Follow-Ups ({followUps.length})</TabsTrigger>
                    <TabsTrigger value="customers">Active Customers ({customers.length})</TabsTrigger>
                </TabsList>
                <LeadsTab leads={leads} />
                <FollowUpsTab followUps={followUps} />
                <CustomersTab customers={customers} />
            </Tabs>
        </div>
    );
}

export default function PipelinePageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PipelinePage />
        </Suspense>
    );
}