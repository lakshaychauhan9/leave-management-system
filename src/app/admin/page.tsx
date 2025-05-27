"use client";

import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function EmployeeDashboard() {
  return (
    <div className="p-4">
      <h1>Employee Dashboard</h1>
      <Button onClick={logout}>Logout</Button>
    </div>
  );
}
