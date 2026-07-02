import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authService } from "@/lib/services/auth-service";
import type { Role } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = Number(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "ID user tidak valid" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { role, isActive } = body as {
      role?: string;
      isActive?: boolean;
    };

    const currentUserId = Number(session.user.userId);

    const errors: string[] = [];

    if (
      role !== undefined &&
      role !== "ADMIN" &&
      role !== "SISWA"
    ) {
      errors.push("Role harus ADMIN atau SISWA");
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
      errors.push("isActive harus boolean");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join("; ") },
        { status: 400 }
      );
    }

    let updated;
    if (role !== undefined) {
      try {
        updated = await authService.updateUserRole(
          userId,
          role as Role,
          currentUserId
        );
      } catch (e) {
        if (e instanceof Error && e.message === "CANNOT_CHANGE_OWN_ROLE") {
          return NextResponse.json(
            { success: false, error: "Tidak dapat mengubah role akun sendiri" },
            { status: 400 }
          );
        }
        throw e;
      }
    }

    if (isActive !== undefined) {
      try {
        updated = await authService.toggleUserActive(
          userId,
          isActive,
          currentUserId
        );
      } catch (e) {
        if (
          e instanceof Error &&
          e.message === "CANNOT_DEACTIVATE_OWN_ACCOUNT"
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Tidak dapat menonaktifkan akun sendiri",
            },
            { status: 400 }
          );
        }
        throw e;
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
