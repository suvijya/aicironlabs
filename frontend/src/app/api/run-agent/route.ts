import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    // Create temporary file with inputs format expected by agent2.py: JSON list of objects/strings
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `agent-input-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.json`);
    
    // agent2.py reads test.json format (an array of inputs)
    fs.writeFileSync(tempFile, JSON.stringify([prompt]));

    // Path to agent2.py in iron-labs-ai-hackathon directory
    const agentPath = path.join(
      process.cwd(),
      "..",
      "iron-labs-ai-hackathon",
      "agent2.py"
    );

    return new Promise<NextResponse>((resolve) => {
      // Spawn python "agent2.py" "tempFile"
      exec(`python "${agentPath}" "${tempFile}"`, {
        cwd: path.dirname(agentPath),
      }, (error, stdout, stderr) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {}

        if (error) {
          console.error("Python Execution Error:", error, stderr);
          return resolve(
            NextResponse.json({ error: `Agent2 execution failed: ${stderr || error.message}` }, { status: 500 })
          );
        }

        try {
          // agent2.py outputs a json list of predictions (e.g. ["answer"])
          const predictions = JSON.parse(stdout.trim());
          if (Array.isArray(predictions) && predictions.length > 0) {
            return resolve(NextResponse.json({ answer: predictions[0] }));
          }
          return resolve(NextResponse.json({ answer: stdout.trim() }));
        } catch (parseError) {
          console.error("Failed to parse agent output:", stdout, parseError);
          return resolve(
            NextResponse.json({ error: "Invalid response from Agent 2", raw: stdout }, { status: 500 })
          );
        }
      });
    });
  } catch (e: any) {
    console.error("API Route Error:", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
