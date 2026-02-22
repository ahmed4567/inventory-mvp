'use client';

import { useState } from 'react';



export default function DashboardPage() {
    const [stats] = useState([
        { label: 'Total Items', value: '1,234' },
        { label: 'Low Stock', value: '45' },
        { label: 'Recent Orders', value: '12' },
        { label: 'Revenue', value: '$5,680' },
    ]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}