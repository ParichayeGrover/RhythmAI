import { NextRequest, NextResponse } from "next/server";

function getRequiredEnv(name: string) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}


export async function POST(req: NextRequest) {
    try {
        const pythonBasslineUrl = getRequiredEnv("PYTHON_BASSLINE_URL");
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            console.log("Error 1")
            return NextResponse.json({ error: "No file provided !" }, { status: 400 });
        }


        console.log("Step 2 ")
        const pythonResponse = await fetch(pythonBasslineUrl, {
            method: "POST",
            body: formData
        });

        if (!pythonResponse.ok) {
            throw new Error(`Python API failed with status: ${pythonResponse.status}`);
        }

        const arrayBuffer = await pythonResponse.arrayBuffer();
        return new NextResponse(arrayBuffer,{
            status:200,
            headers:{
                "Content-Type": "audio/midi",
                "Content-Disposition":'attachment; filename="generated_bassline.mid"'
            }
        });

    }
    catch(error){
        console.log("Proxy Error  : ", error);
        return NextResponse.json({error:"Failed to communicate with AI Engine"}, {status : 500});
    }
}