// file: components/layout/SidebarNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    DollarSign,
    Settings,
    BookText,
} from "lucide-react";

// Navigation items
const navItems = [
    // ... (existing nav items are correct)
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Daily Log", href: "/log", icon: CalendarDays },
    { name: "Pipeline", href: "/pipeline", icon: Users },
    { name: "Financials", href: "/financials", icon: DollarSign },
    { name: "Scripts", href: "/scripts", icon: BookText },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function SidebarNav() {
    const pathname = usePathname();

    return (
        <nav className="hidden md:block w-64 bg-white border-r">
            <div className="p-4">
                {/* --- NAME UPDATED HERE --- */}
                <h2 className="text-xl font-bold text-gray-800">
                    No-BS Business Tracker
                </h2>
                <p className="text-xs text-secondary">No Gurus, Just Grit</p>
            </div>
            <div className="px-2 py-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname.startsWith(item.href)
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        <span>{item.name}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}