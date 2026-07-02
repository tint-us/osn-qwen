"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuestionDisplay } from "@/components/shared/QuestionDisplay";

interface QuestionListItem {
  id: number;
  tingkat: string;
  level: string;
  matpel: string;
  questionType: string;
  contentPreview: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface QuestionsData {
  items: QuestionListItem[];
  pagination: Pagination;
}

interface QuestionTableProps {
  onEdit: (id: number) => void;
  refreshKey: number;
}

export function QuestionTable({ onEdit, refreshKey }: QuestionTableProps) {
  const [data, setData] = useState<QuestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tingkatFilter, setTingkatFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [matpelFilter, setMatpelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (search) params.set("search", search);
      if (tingkatFilter) params.set("tingkat", tingkatFilter);
      if (levelFilter) params.set("level", levelFilter);
      if (matpelFilter) params.set("matpel", matpelFilter);
      if (typeFilter) params.set("questionType", typeFilter);

      const res = await fetch(`/api/admin/questions?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal memuat data");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page, search, tingkatFilter, levelFilter, matpelFilter, typeFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions, refreshKey]);

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/questions/${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menghapus soal");
      setDeleteId(null);
      fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  }

  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "default" as const;
      case "SHORT_ANSWER":
        return "secondary" as const;
      case "ESSAY":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Cari</Label>
          <Input
            placeholder="Cari soal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tingkat</Label>
          <select
            value={tingkatFilter}
            onChange={(e) => setTingkatFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Semua</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Level</Label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Semua</option>
            <option value="OSNK">OSNK</option>
            <option value="OSNP">OSNP</option>
            <option value="SEMIFINAL">Semifinal</option>
            <option value="FINAL">Final</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipe</Label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Semua</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="ESSAY">Essay</option>
          </select>
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">ID</th>
              <th className="px-3 py-2 text-left font-medium">Tingkat</th>
              <th className="px-3 py-2 text-left font-medium">Level</th>
              <th className="px-3 py-2 text-left font-medium">Matpel</th>
              <th className="px-3 py-2 text-left font-medium">Tipe</th>
              <th className="px-3 py-2 text-left font-medium">Preview</th>
              <th className="px-3 py-2 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Belum ada soal
                </td>
              </tr>
            )}
            {!loading &&
              data?.items.map((q) => (
                <tr key={q.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground">{q.id}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{q.tingkat}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{q.level}</Badge>
                  </td>
                  <td className="px-3 py-2">{q.matpel}</td>
                  <td className="px-3 py-2">
                    <Badge variant={typeBadgeVariant(q.questionType)}>
                      {q.questionType}
                    </Badge>
                  </td>
                  <td className="max-w-xs px-3 py-2">
                    <span className="line-clamp-1 text-muted-foreground">
                      <QuestionDisplay content={q.contentPreview} />
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(q.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(q.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {data.pagination.page} dari {data.pagination.totalPages} (
            {data.pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !deleteLoading && setDeleteId(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Hapus Soal?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tindakan ini tidak dapat dibatalkan. Soal akan dihapus permanen
              dari bank soal.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteId(null)}
                disabled={deleteLoading}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
