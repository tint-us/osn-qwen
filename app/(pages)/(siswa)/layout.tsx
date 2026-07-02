import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SISWA") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold">SoaLatihan</h1>
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/study"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Study Mode
              </Link>
              <Link
                href="/exam"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Exam Mode
              </Link>
              <Link
                href="/history"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Riwayat
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm">
                {session.user.name}
              </Button>
            </Link>
            <form action="/api/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
