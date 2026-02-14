// FILE: src/app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    // Default PIN is 1234 (4-digit)
    const validPin = process.env.NEXT_PUBLIC_DEMO_PIN || "1234";

    // Verify PIN
    if (!pin || pin !== validPin) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 },
      );
    }

    // Simple Mock Auth Logic
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      // Default user role for PIN-based login
      const email = "user@nexus.ai";
      const role = "VIEWER";

      // In a real app, sign a JWT here.
      // We will just set a simple cookie for the demo.
      let user;
      try {
        user = await db.user.findUnique({ where: { email } });

        // Create user if doesn't exist
        if (!user) {
          user = await db.user.create({
            data: {
              email,
              role,
            },
          });
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // If database fails, still allow login with default user data
        user = {
          id: "demo-id",
          email,
          role,
        };
      }

      // Create payload
      const payload = JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const res = NextResponse.json({
        success: true,
        user: {
          email: user.email,
          role: user.role
        }
      });

      // HTTP Only Cookie
      res.cookies.set("execubot_session", payload, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      return res;
    }

    return NextResponse.json({ error: "Auth disabled" }, { status: 403 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("execubot_session");
  return res;
}
