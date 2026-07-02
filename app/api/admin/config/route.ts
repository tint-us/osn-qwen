import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAllConfig,
  upsertManyConfig,
  getAIConfig,
  getExamConfig,
  type ConfigUpdate,
} from "@/lib/admin/config";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const [configs, aiConfig, examConfig] = await Promise.all([
      getAllConfig(),
      getAIConfig(),
      getExamConfig(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        configs,
        aiConfig: {
          apiKey: aiConfig.apiKey ? "••••••••" : "",
          baseUrl: aiConfig.baseUrl,
          systemPrompt: aiConfig.systemPrompt,
        },
        examConfig,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/config] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { aiConfig, examConfig } = body as {
      aiConfig?: {
        apiKey?: string;
        baseUrl?: string;
        systemPrompt?: string;
      };
      examConfig?: {
        defaultBatchSize?: number;
        defaultTimerEnabled?: boolean;
        defaultTimerDuration?: number;
      };
    };

    const updates: ConfigUpdate[] = [];

    if (aiConfig) {
      if (aiConfig.apiKey && aiConfig.apiKey !== "••••••••") {
        updates.push({ key: "ai_api_key", value: aiConfig.apiKey });
      }
      if (aiConfig.baseUrl !== undefined) {
        updates.push({ key: "ai_base_url", value: aiConfig.baseUrl });
      }
      if (aiConfig.systemPrompt !== undefined) {
        updates.push({ key: "ai_system_prompt", value: aiConfig.systemPrompt });
      }
    }

    if (examConfig) {
      if (examConfig.defaultBatchSize !== undefined) {
        const batchSize = Number(examConfig.defaultBatchSize);
        if (isNaN(batchSize) || batchSize < 1 || batchSize > 100) {
          return NextResponse.json(
            { success: false, error: "Batch size harus antara 1-100" },
            { status: 400 }
          );
        }
        updates.push({
          key: "exam_default_batch_size",
          value: String(batchSize),
        });
      }
      if (examConfig.defaultTimerEnabled !== undefined) {
        updates.push({
          key: "exam_default_timer_enabled",
          value: String(examConfig.defaultTimerEnabled),
        });
      }
      if (examConfig.defaultTimerDuration !== undefined) {
        const duration = Number(examConfig.defaultTimerDuration);
        if (isNaN(duration) || duration < 1) {
          return NextResponse.json(
            { success: false, error: "Timer duration harus angka positif" },
            { status: 400 }
          );
        }
        updates.push({
          key: "exam_default_timer_duration",
          value: String(duration),
        });
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada field untuk diupdate" },
        { status: 400 }
      );
    }

    await upsertManyConfig(updates);

    return NextResponse.json({ success: true, data: { updated: updates.length } });
  } catch (error) {
    console.error("[PUT /api/admin/config] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
