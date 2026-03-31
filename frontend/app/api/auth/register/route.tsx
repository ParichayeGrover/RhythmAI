import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import bcrypt from "bcryptjs"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, 
      },
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}