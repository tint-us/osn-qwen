import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authService } from "@/lib/services/auth-service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;
    const search = searchParams.get("search") || undefined;

    const result = await authService.getAllUsers(
      Math.max(1, page),
      Math.min(100, pageSize),
      search
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[GET /api/admin/users] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, username, email, password } = body as {
      name?: string;
      username?: string;
      email?: string;
      password?: string;
    };

    const errors: string[] = [];

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      errors.push("Nama wajib diisi");
    }
    if (!username || typeof username !== "string" || username.trim().length < 4) {
      errors.push("Username minimal 4 karakter");
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push("Username hanya boleh huruf, angka, dan underscore");
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      errors.push("Password minimal 8 karakter");
    }
    if (
      email !== undefined &&
      email !== null &&
      email !== "" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.push("Format email tidak valid");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join("; ") },
        { status: 400 }
      );
    }

    if (username) {
      const usernameTaken = await authService.isUsernameTaken(username);
      if (usernameTaken) {
        return NextResponse.json(
          { success: false, error: "Username sudah digunakan" },
          { status: 409 }
        );
      }
    }

    if (email && email !== "") {
      const emailTaken = await authService.isEmailTaken(email);
      if (emailTaken) {
        return NextResponse.json(
          { success: false, error: "Email sudah digunakan" },
          { status: 409 }
        );
      }
    }

    const created = await authService.createUser({
      name: name!.trim(),
      username: username!.trim(),
      email: email?.trim() || undefined,
      password: password!,
    });

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/users] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
