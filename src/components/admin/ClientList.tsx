"use client";
import React, { useState } from 'react';

export default function ClientList({ initialClients }: { initialClients: any[] }) {
  const [clients, setClients] = useState(initialClients || []);
  const [name, setName] = useState('');

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/clients', { method: 'POST', body: JSON.stringify({ name }), headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (data.client) setClients(prev => [data.client, ...prev]);
    setName('');
  }

  async function toggleSuspend(clientId: string, currentStatus: string) {
    const action = currentStatus === 'ACTIVE' ? 'suspend' : 'activate';
    const res = await fetch('/api/admin/clients', { method: 'PATCH', body: JSON.stringify({ clientId, action }), headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (data.client) setClients(prev => prev.map(c => c.id === data.client.id ? data.client : c));
  }

  async function deleteClient(clientId: string) {
    const res = await fetch(`/api/admin/clients?clientId=${clientId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) setClients(prev => prev.filter(c => c.id !== clientId));
  }

  async function generateLicense(clientId: string) {
    const res = await fetch('/api/admin/licenses', { method: 'POST', body: JSON.stringify({ clientId }), headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (data.key) alert('Licence générée: ' + data.key);
  }

  return (
    <div>
      <form onSubmit={createClient} className="mb-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la pharmacie" className="border p-2 mr-2" />
        <button className="bg-blue-600 text-white p-2">Créer</button>
      </form>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left">Nom</th>
            <th>Contact</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id} className="border-t">
              <td>{c.name}</td>
              <td>{c.contactEmail || c.contactPhone || '-'}</td>
              <td>{c.status}</td>
              <td>
                <button onClick={() => toggleSuspend(c.id, c.status)} className="mr-2">{c.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}</button>
                <button onClick={() => generateLicense(c.id)} className="mr-2">Générer Licence</button>
                <button onClick={() => deleteClient(c.id)} className="text-red-600">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
