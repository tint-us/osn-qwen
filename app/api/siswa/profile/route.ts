import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authService } from "@/lib/services/auth-service";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = Number(session.user.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, username, email } = body as {
      name?: string;
      username?: string;
      email?: string | null;
    };

    const errors: string[] = [];

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 1) {
        errors.push("Nama tidak boleh kosong");
      }
    }

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length < 4) {
        errors.push("Username minimal 4 karakter");
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push("Username hanya boleh huruf, angka, dan underscore");
      } else {
        const taken = await authService.isUsernameTaken(username, userId);
        if (taken) {
          errors.push("Username sudah digunakan");
        }
      }
    }

    if (email !== undefined && email !== null && email !== "") {
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Format email tidak valid");
      } else {
        const taken = await authService.isEmailTaken(email, userId);
        if (taken) {
          errors.push("Email sudah digunakan");
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join("; ") },
        { status: 400 }
      );
    }

    const updated = await authService.updateProfile(userId, {
      name: name?.trim(),
      username: username?.trim(),
      email: email === null ? null : email?.trim() || undefined,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/siswa/profile] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
