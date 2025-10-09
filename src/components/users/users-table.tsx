'use client';

import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/actions/users';
import { User } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserForm } from './user-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { createSchema, updateSchema } from './user-form';

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User & { role: 'admin' | 'seller' } | null>(null);

  const fetchUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFormSubmit = async (data: z.infer<typeof createSchema> | z.infer<typeof updateSchema>) => {
    console.log('Form submitted with data:', data);
    if (editingUser) {
      const updatePayload: { username: string; password?: string; role?: string } = { username: data.username };
      if ('password' in data && data.password !== undefined && data.password !== '') {
        updatePayload.password = data.password;
      }
      await updateUser(editingUser.id, { ...updatePayload, role: editingUser.role });
      toast.success('Vendeur mis à jour avec succès!');
    } else {
      if (!('password' in data) || data.password === undefined || data.password === '') {
        toast.error('Le mot de passe est requis pour la création d&apos;un utilisateur.');
        return;
      }
      // Créer l'utilisateur avec les champs de base seulement
      const newUser = await createUser({ 
        username: data.username, 
        password: data.password, 
        role: 'seller'
      } as any); // Utilisation temporaire de 'as any' pour contourner le problème de type
      
      // Mettre à jour avec les champs d'essai par défaut
      if (newUser) {
        await updateUser(newUser.id, {
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          isTrialActive: true,
          subscriptionType: 'trial'
        } as any);
      }
      toast.success('Vendeur ajouté avec succès!');
    }
    fetchUsers();
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce vendeur ?')) {
      await deleteUser(userId);
      toast.success('Vendeur supprimé avec succès!');
      fetchUsers();
    }
  };

  const handleEditClick = (user: User) => {
    // The `User` type from Prisma has `role` as a string; narrow it to the
    // expected union for the editing form by casting. This is a minimal,
    // safe change to satisfy the type system during runtime the role value
    // should already be one of the expected values.
    setEditingUser(user as User & { role: 'admin' | 'seller' });
    setIsDialogOpen(true);
  };

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingUser(null); // Clear editing user when dialog closes
      }}>
        <DialogTrigger asChild>
          <Button onClick={() => setEditingUser(null)}>Ajouter un utilisateur</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
          </DialogHeader>
          <UserForm onSubmit={handleFormSubmit} defaultValues={editingUser || undefined} />
        </DialogContent>
      </Dialog>

      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Nom d&apos;utilisateur</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditClick(user)}>
                  Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
                  Supprimer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}