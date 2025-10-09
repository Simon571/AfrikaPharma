import React from 'react';

import ClientList from '@/components/admin/ClientList';

export default async function AdminPage() {
  // Server component: fetch clients from admin API
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/clients`, { cache: 'no-store' });
  const data = await res.json();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Console Super-Admin</h1>
      <ClientList initialClients={data.clients || []} />
    </div>
  );
}
