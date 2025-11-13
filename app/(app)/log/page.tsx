// file: app/(app)/log/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";

import { AddFormDialog, EditFormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Edit, PlusCircle } from "lucide-react";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);

const getToday = () => new Date().toISOString().split("T")[0];

// --- Zod Schemas ---
const startDaySchema = z.object({
    mainGoal: z.string().min(3, "A goal is required"),
});
type StartDayFormValues = z.infer<typeof startDaySchema>;

const detailsSchema = z.object({
    mainGoal: z.string().min(3, "Goal is required"),
    what: z.string().optional(),
    why: z.string().optional(),
    adjust: z.string().optional(),
    p1: z.string().optional(),
    p2: z.string().optional(),
    p3: z.string().optional(),
});
type DetailsFormValues = z.infer<typeof detailsSchema>;

const expenseSchema = z.object({
    expenses: z.coerce.number().min(0),
});
type ExpenseFormValues = z.infer<typeof expenseSchema>;

const outreachSchema = z.object({
    time: z.string().min(1, "Time required"),
    method: z.string().min(1, "Method required"),
    person: z.string().min(1, "Person required"),
    response: z.union([
        z.literal("Y"), z.literal("N"), z.literal("M"), z.literal(""),
    ]),
    followUpNeeded: z.boolean(),
});
type OutreachFormValues = z.infer<typeof outreachSchema>;

const jobSchema = z.object({
    customer: z.string().min(1, "Customer required"),
    service: z.string().min(1, "Service required"),
    amountCharged: z.coerce.number().min(0.01),
    isPaid: z.boolean(),
    referralAsked: z.boolean(),
    notes: z.string().optional(),
});
type JobFormValues = z.infer<typeof jobSchema>;

// --- Page Component ---
    function DailyLogPage() {
        const router = useRouter();
        const searchParams = useSearchParams();
    
        const selectedDate = useMemo(() => {
            const dateParam = searchParams.get("date");
            return dateParam || getToday();
        }, [searchParams]);
    
        const onDateSelect = (date: Date | undefined) => {
            if (date) {
                router.push(`/log?date=${date.toISOString().split("T")[0]}`);
            }
        };
    
        const logData = useQuery(api.dailyLogs.getForDate, { date: selectedDate });
        const createLog = useMutation(api.dailyLogs.create);
        const addOutreach = useMutation(api.dailyLogs.addOutreach);
        const updateOutreach = useMutation(api.dailyLogs.updateOutreach);
        const addCompletedJob = useMutation(api.dailyLogs.addCompletedJob);
        const updateCompletedJob = useMutation(api.dailyLogs.updateCompletedJob);
        const updateLogDetails = useMutation(api.dailyLogs.updateLogDetails);
        const updateExpenses = useMutation(api.dailyLogs.updateExpenses);
    
        const startDayForm = useForm<StartDayFormValues>({
            resolver: zodResolver(startDaySchema),
            defaultValues: { mainGoal: "" },
        });
    
        async function onStartDaySubmit(values: StartDayFormValues) {
            try {
                await createLog({ date: selectedDate, mainGoal: values.mainGoal });
                startDayForm.reset();
                toast.success("Log started!");
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Something went wrong");
            }
        }
    
        const renderContent = () => {
            if (logData === undefined) return <div>Loading log...</div>;
    
            if (logData === null) {
                return (
                    <Card className="max-w-lg">
                        <CardHeader>
                            <CardTitle>Start Your Day: {selectedDate}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...startDayForm}>
                                <form
                                    onSubmit={startDayForm.handleSubmit(onStartDaySubmit)}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={startDayForm.control}
                                        name="mainGoal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Today's Main Goal</FormLabel>
                                                <FormControl><Input placeholder="e.g., Land 1 new customer" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={startDayForm.formState.isSubmitting}>
                                        {startDayForm.formState.isSubmitting ? "Starting..." : "Start Log"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                );
            }
    
            const { log, appointments, outreach, jobs } = logData;
    
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Daily Log: {log.date}</h2>
    
                    {/* --- Customer Outreach --- */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Customer Outreach Tracker</CardTitle>
                                <AddFormDialog
                                    schema={outreachSchema}
                                    onSubmit={async (values) => { await addOutreach({ ...values, dailyLogId: log._id }); }}
                                    defaultValues={{ // dailyLogId is added in onSubmit, not part of the form values
                                        time: format(new Date(), "HH:mm"),
                                        method: "", person: "", response: "", followUpNeeded: false,
                                    }}
                                    title="Add Outreach Entry"
                                    successMessage="Outreach added!"
                                    triggerButton={<Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>}
                                    formFields={(form) => (
                                        <>
                                            <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="method" render={({ field }) => (<FormItem><FormLabel>Method</FormLabel><FormControl><Input placeholder="e.g., Phone, In-person" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="person" render={({ field }) => (<FormItem><FormLabel>Person/Business</FormLabel><FormControl><Input placeholder="e.g., John @ ABC Inc" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="response" render={({ field }) => (<FormItem><FormLabel>Response (Y/N/M)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Y">Yes (Y)</SelectItem><SelectItem value="N">No (N)</SelectItem><SelectItem value="M">Maybe (M)</SelectItem><SelectItem value="">None</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="followUpNeeded" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Follow-up Needed?</FormLabel></FormItem>)} />
                                        </>
                                    )}
                                />
                            </div>
                            <CardDescription>"5 Approaches Minimum Per Day"</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Method</TableHead><TableHead>Person</TableHead><TableHead>Res</TableHead><TableHead>FollowUp</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {outreach.map(o => (
                                        <TableRow key={o._id}>
                                            <TableCell>{o.time}</TableCell><TableCell>{o.method}</TableCell><TableCell>{o.person}</TableCell><TableCell>{o.response}</TableCell><TableCell>{o.followUpNeeded ? "Yes" : "No"}</TableCell>
                                            <TableCell>
                                                <EditFormDialog
                                                    schema={outreachSchema}
                                                    onSubmit={async (values) => { await updateOutreach({ id: o._id, ...values }); }}
                                                    defaultValues={o}
                                                    title="Edit Outreach Entry"
                                                    successMessage="Outreach updated!"
                                                    triggerButton={<Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>}
                                                    formFields={(form) => (
                                                        <>
                                                            <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="method" render={({ field }) => (<FormItem><FormLabel>Method</FormLabel><FormControl><Input placeholder="e.g., Phone, In-person" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="person" render={({ field }) => (<FormItem><FormLabel>Person/Business</FormLabel><FormControl><Input placeholder="e.g., John @ ABC Inc" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="response" render={({ field }) => (<FormItem><FormLabel>Response (Y/N/M)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Y">Yes (Y)</SelectItem><SelectItem value="N">No (N)</SelectItem><SelectItem value="M">Maybe (M)</SelectItem><SelectItem value="">None</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="followUpNeeded" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Follow-up Needed?</FormLabel></FormItem>)} />
                                                        </>
                                                    )}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
    
                    {/* --- Jobs Completed --- */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Jobs Completed Today</CardTitle>
                                <AddFormDialog
                                    schema={jobSchema}
                                    onSubmit={async (values) => { await addCompletedJob({ ...values, dailyLogId: log._id }); }}
                                    defaultValues={{ // dailyLogId is added in onSubmit, not part of the form values
                                        customer: "", service: "", amountCharged: 0, isPaid: false, referralAsked: false, notes: "",
                                    }}
                                    title="Add Completed Job"
                                    successMessage="Job added!"
                                    triggerButton={<Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>}
                                    formFields={(form) => (
                                        <>
                                            <FormField control={form.control} name="customer" render={({ field }) => (<FormItem><FormLabel>Customer</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="service" render={({ field }) => (<FormItem><FormLabel>Service</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="amountCharged" render={({ field }) => (<FormItem><FormLabel>Amount Charged</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="isPaid" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Paid?</FormLabel></FormItem>)} />
                                            <FormField control={form.control} name="referralAsked" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Referral Asked?</FormLabel></FormItem>)} />
                                            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </>
                                    )}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Service</TableHead><TableHead>Amount</TableHead><TableHead>Paid?</TableHead><TableHead>Referral?</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {jobs.map(j => (
                                        <TableRow key={j._id}>
                                            <TableCell>{j.customer}</TableCell><TableCell>{j.service}</TableCell><TableCell>{formatCurrency(j.amountCharged)}</TableCell><TableCell>{j.isPaid ? "Yes" : "No"}</TableCell><TableCell>{j.referralAsked ? "Yes" : "No"}</TableCell>
                                            <TableCell>
                                                <EditFormDialog
                                                    schema={jobSchema}
                                                    onSubmit={async (values) => { await updateCompletedJob({ id: j._id, ...values }); }}
                                                    defaultValues={j}
                                                    title="Edit Job"
                                                    successMessage="Job updated!"
                                                    triggerButton={<Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>}
                                                    formFields={(form) => (
                                                        <>
                                                            <FormField control={form.control} name="customer" render={({ field }) => (<FormItem><FormLabel>Customer</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="service" render={({ field }) => (<FormItem><FormLabel>Service</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="amountCharged" render={({ field }) => (<FormItem><FormLabel>Amount Charged</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="isPaid" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Paid?</FormLabel></FormItem>)} />
                                                            <FormField control={form.control} name="referralAsked" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Referral Asked?</FormLabel></FormItem>)} />
                                                            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </>
                                                    )}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
    
                    {/* --- Daily Money --- */}
                    <Card>
                        <CardHeader><CardTitle>Daily Money</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg">Revenue Today: <span className="font-bold text-green-600">{formatCurrency(log.revenueToday)}</span> (from paid jobs)</p>
                            <Form {...useForm<ExpenseFormValues>({ resolver: zodResolver(expenseSchema), defaultValues: { expenses: log.expensesToday } })}>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const expenses = (e.target as any).elements.expenses.valueAsNumber;
                                        updateExpenses({ logId: log._id, expenses }).catch(err => toast.error(err instanceof Error ? err.message : "Something went wrong"));
                                    }}
                                    className="flex items-center space-x-2 mt-4"
                                >
                                    <FormField
                                        name="expenses"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Expenses Today</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="mt-6">Update</Button>
                                </form>
                            </Form>
                            <p className="text-lg mt-4">Net Profit: <span className="font-bold">{formatCurrency(log.revenueToday - log.expensesToday)}</span></p>
                        </CardContent>
                    </Card>
    
                    {/* --- Details & Review --- */}
                    <Card>
                        <CardHeader><CardTitle>Daily Review & Prep</CardTitle></CardHeader>
                        <CardContent>
                            <Form {...useForm<DetailsFormValues>({
                                resolver: zodResolver(detailsSchema),
                                defaultValues: {
                                    mainGoal: log.mainGoal,
                                    what: log.failureData.what,
                                    why: log.failureData.why,
                                    adjust: log.failureData.adjust,
                                    p1: log.tomorrowPriorities[0] ?? "",
                                    p2: log.tomorrowPriorities[1] ?? "",
                                    p3: log.tomorrowPriorities[2] ?? "",
                                }
                            })}>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const data = new FormData(e.target as HTMLFormElement);
                                        updateLogDetails({
                                            logId: log._id,
                                            mainGoal: data.get("mainGoal") as string,
                                            failureData: {
                                                what: data.get("what") as string,
                                                why: data.get("why") as string,
                                                adjust: data.get("adjust") as string,
                                            },
                                            tomorrowPriorities: [
                                                data.get("p1") as string,
                                                data.get("p2") as string,
                                                data.get("p3") as string,
                                            ],
                                        }).then(() => toast.success("Log details saved!"))
                                            .catch(err => toast.error(err instanceof Error ? err.message : "Something went wrong"));
                                    }}
                                    className="space-y-6"
                                >
                                    <FormField name="mainGoal" render={({ field }) => (<FormItem><FormLabel>Today's Main Goal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <h3 className="font-semibold text-lg">Failure is Data</h3>
                                    <FormField name="what" render={({ field }) => (<FormItem><FormLabel>What didn't work today?</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                                    <FormField name="why" render={({ field }) => (<FormItem><FormLabel>Why?</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                                    <FormField name="adjust" render={({ field }) => (<FormItem><FormLabel>What will I adjust tomorrow?</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                                    <h3 className="font-semibold text-lg">Tomorrow's Prep</h3>
                                    <FormField name="p1" render={({ field }) => (<FormItem><FormLabel>Priority 1</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField name="p2" render={({ field }) => (<FormItem><FormLabel>Priority 2</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField name="p3" render={({ field }) => (<FormItem><FormLabel>Priority 3</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <Button type="submit">Save Details</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            );
        };

    // Memoize selected date object to prevent Calendar rerenders
    const selectedDateObj = useMemo(
        () => new Date(selectedDate + "T12:00:00"),
        [selectedDate]
    );

    return (
        <div className="p-4 md:p-8 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">{renderContent()}</div>
            <div className="md:col-span-1">
                <Card>
                    <CardContent className="p-0">
                        <Calendar
                            mode="single"
                            selected={selectedDateObj}
                            onSelect={onDateSelect}
                            className="p-0"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Wrap in Suspense for useSearchParams()
export default function DailyLogPageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DailyLogPage />
        </Suspense>
    );
} 