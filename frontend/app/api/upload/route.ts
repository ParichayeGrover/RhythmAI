import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSupabaseAdminClient() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey);
}

async function ensureBucketExists(supabase: ReturnType<typeof createClient>, bucketName: string) {
  const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucketName);

  if (!getBucketError && existingBucket) {
    return;
  }

  const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
    public: true,
  });

  if (createBucketError) {
    throw new Error(`Failed to ensure bucket '${bucketName}': ${createBucketError.message}`);
  }
}

async function generateMidiWithPython(
  pythonBasslineUrl: string,
  buffer: Buffer,
  fileName: string,
  contentType?: string
) {
  const pythonFormData = new FormData();
  const blob = new Blob([buffer], { type: contentType || "application/octet-stream" });
  pythonFormData.append("file", blob, fileName);

  const pythonResponse = await fetch(pythonBasslineUrl, {
    method: "POST",
    body: pythonFormData,
  });

  if (!pythonResponse.ok) {
    const errorBody = await pythonResponse.text();
    throw new Error(`Python API failed (${pythonResponse.status}): ${errorBody}`);
  }

  const midiArrayBuffer = await pythonResponse.arrayBuffer();
  return Buffer.from(midiArrayBuffer);
}

export async function POST(request: Request) {
  try {
    const pythonBasslineUrl = getRequiredEnv("PYTHON_BASSLINE_URL");
    const supabaseBucketName = getRequiredEnv("SUPABASE_BUCKET_NAME");

    // 2. Security Check: Is the user actually logged in?
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID from the database using their session email
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 3. Extract the audio file from the frontend request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 4. Convert the file to raw binary data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. THE CRYPTO ENGINE: Generate the SHA-256 Hash
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
    console.log("File Hash Generated:", fileHash);

    // 6. THE DEDUPLICATION CHECK
    let fileAsset = await prisma.fileAsset.findUnique({
      where: { fileHash: fileHash },
    });
    let deduplicated = false;

    if (fileAsset) {
      deduplicated = true;
      console.log("DEDUPLICATION WIN! File already exists in the Vault.");
      // We skip the Supabase upload entirely!
    } else {
      console.log("New file detected. Uploading to Supabase Vault...");
      const supabase = getSupabaseAdminClient();
      await ensureBucketExists(supabase, supabaseBucketName);
      
      // 7. Upload the raw audio to Supabase Storage
      const audioFileName = `${fileHash}.wav`; // We name the file its own hash for safety
      const { data, error } = await supabase.storage
        .from(supabaseBucketName)
        .upload(audioFileName, buffer, {
          contentType: "audio/wav",
          upsert: false,
        });

      if (error) throw error;

      // Get the public URL of the uploaded file
      const { data: publicAudioUrlData } = supabase.storage
        .from(supabaseBucketName)
        .getPublicUrl(audioFileName);

      // 8. Generate the MIDI from your local Python FastAPI service
      const midiBuffer = await generateMidiWithPython(
        pythonBasslineUrl,
        buffer,
        file.name,
        file.type
      );

      // 9. Upload generated MIDI to Supabase Storage
      const midiFileName = `${fileHash}.mid`;
      const { error: midiUploadError } = await supabase.storage
        .from(supabaseBucketName)
        .upload(midiFileName, midiBuffer, {
          contentType: "audio/midi",
          upsert: false,
        });

      if (midiUploadError) throw midiUploadError;

      const { data: publicMidiUrlData } = supabase.storage
        .from(supabaseBucketName)
        .getPublicUrl(midiFileName);

      // 10. Save the brand new physical file record to Prisma
      fileAsset = await prisma.fileAsset.create({
        data: {
          fileHash: fileHash,
          compressedAudioUrl: publicAudioUrlData.publicUrl,
          midiUrl: publicMidiUrlData.publicUrl,
        },
      });
    }

    // 9. Create the Dashboard "Track" linking the user to the FileAsset
    const track = await prisma.track.create({
      data: {
        originalFileName: file.name,
        userId: user.id,
        fileAssetId: fileAsset.id,
      },
    });

    return NextResponse.json({ 
      message: "Upload successful", 
      trackId: track.id,
      deduplicated, // Tells the frontend if we saved compute time
      midiUrl: fileAsset.midiUrl,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}