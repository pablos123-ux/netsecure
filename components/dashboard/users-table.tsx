'use client';
import { useEffect, useState } from 'react';
import { User } from '@/types';

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!Array.isArray(users) || users.length === 0) {
    return <div className="p-6 text-gray-500">No users found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Role</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Province</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">District</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t">
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2">{u.email}</td>
              <td className="px-4 py-2">{u.role}</td>
              <td className="px-4 py-2">{u.assignedProvince?.name || '-'}</td>
              <td className="px-4 py-2">{u.assignedDistrict?.name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}