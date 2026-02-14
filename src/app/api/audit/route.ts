// FILE: src/app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { Parser } from "@json2csv/plainjs";

export const dynamic = "force-dynamic"; // Ensure no caching for logs

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");

  try {
    const logs = await db.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
      include: { user: true },
    });

    if (format === "csv") {
      const parser = new Parser();
      const csv = parser.parse(
        logs.map((l) => ({
          id: l.id,
          action: l.action,
          details: l.details,
          user: l.user?.email || "System",
          time: l.timestamp.toISOString(),
        })),
      );

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="audit-trail.csv"',
        },
      });
    }

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const log = await db.auditLog.create({
      data: {
        action: body.action,
        details: body.details,
        userId: body.userId || null, // Optional link to user
        metadata: body.metadata ? JSON.stringify(body.metadata) : undefined,
      },
    });
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
  }
}
