import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense
        fallback={
          <div className="text-muted-foreground">Memuat...</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
