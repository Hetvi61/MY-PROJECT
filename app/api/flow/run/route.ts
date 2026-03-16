import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Client from "@/models/clients"
import { executeFlow } from "@/lib/flowExecutor"

export async function POST(req: Request) {

  await connectDB()

  const { clientId, nodes } = await req.json()

  const client = await Client.findById(clientId)

  if (!client) {
    return NextResponse.json({ error: "Client not found" })
  }

  await executeFlow(client, nodes)

  return NextResponse.json({ success: true })
}