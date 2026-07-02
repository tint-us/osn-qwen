"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionTable } from "@/components/admin/QuestionTable";
import { QuestionForm } from "@/components/admin/QuestionForm";

export default function AdminQuestionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleEdit(id: number) {
    setEditId(id);
    setShowForm(true);
  }

  function handleAdd() {
    setEditId(null);
    setShowForm(true);
  }

  function handleSaved() {
    setShowForm(false);
    setEditId(null);
    setRefreshKey((k) => k + 1);
  }

  function handleCancel() {
    setShowForm(false);
    setEditId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bank Soal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola soal: tambah, edit, hapus
          </p>
        </div>
        {!showForm && (
          <Button onClick={handleAdd}>+ Tambah Soal</Button>
        )}
      </div>

      {showForm ? (
        <QuestionForm
          questionId={editId}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      ) : (
        <QuestionTable onEdit={handleEdit} refreshKey={refreshKey} />
      )}
    </div>
  );
}
