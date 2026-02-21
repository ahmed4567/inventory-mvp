'use client';

import React from 'react';



export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}

            {/* Main Content */}
            <div className="flex flex-col flex-1">
                {/* Header */}

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}