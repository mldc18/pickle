"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { CalendarOff, Plus, Trash2 } from "lucide-react";

export default function AdminSchedulePage() {
  const { blockedDates, blockDate, unblockDate } = useApp();
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");

  function handleBlock(e: React.FormEvent) {
    e.preventDefault();
    if (date && message) {
      blockDate(date, message);
      setDate("");
      setMessage("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Schedule Management</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <CalendarOff className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Block a Date</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBlock} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="block-date">Date</Label>
              <Input id="block-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="block-msg">Reason / Message</Label>
              <Input id="block-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g., Court maintenance" />
            </div>
            <Button type="submit" disabled={!date || !message}>
              <Plus className="h-4 w-4" />
              Block Date
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blocked Dates</CardTitle>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-sm text-muted">No blocked dates.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {blockedDates.map((bd) => (
                <div
                  key={bd.date}
                  className="flex items-center justify-between rounded-lg bg-background border border-card-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{formatDate(bd.date)}</p>
                    <p className="text-xs text-muted">{bd.message}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => unblockDate(bd.date)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
