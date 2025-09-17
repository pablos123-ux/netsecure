'use client';

import { useEffect, useState } from 'react';

export default function StaffProfilePage() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setMe(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!me) {
    return <p className="text-muted-foreground">Unable to load profile.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
      <div className="border rounded-lg p-4 bg-card text-card-foreground space-y-2">
        <div><span className="text-sm text-muted-foreground">Name:</span> <span>{me.name}</span></div>
        <div><span className="text-sm text-muted-foreground">Email:</span> <span>{me.email}</span></div>
        <div><span className="text-sm text-muted-foreground">Role:</span> <span>{me.role}</span></div>
      </div>
    </div>
  );
}
