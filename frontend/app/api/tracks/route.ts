// frontend/app/api/tracks/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Identify the user making the request
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Look up their database ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. THE RELATIONAL QUERY (The Magic)
    const tracks = await prisma.track.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }, // Put the newest tracks at the top
      include: {
        fileAsset: true, // This tells Prisma to perform a SQL JOIN and grab the cloud URLs!
      },
    });

    return NextResponse.json(tracks, { status: 200 });
    
  } catch (error) {
    console.error("Failed to fetch tracks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}