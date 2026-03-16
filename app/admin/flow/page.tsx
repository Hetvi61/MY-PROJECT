'use client'

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection
} from '@xyflow/react'

import { useSearchParams } from 'next/navigation'   

import '@xyflow/react/dist/style.css'

const initialNodes = [
  {
    id: "1",
    type: "startNode",
    position: { x: 200, y: 50 },
    data: { label: "Start" }
  },
  {
    id: "2",
    type: "messageNode",
    position: { x: 200, y: 200 },
    data: { label: "Send Welcome", text: "Welcome! Thank you for joining " }
  },
  {
    id: "3",
    type: "delayNode",
    position: { x: 200, y: 350 },
    data: { label: "Wait 1 minute", minutes: 1 }
  },
  {
    id: "4",
    type: "messageNode",
    position: { x: 200, y: 500 },
    data: { label: "Send Offer", text: "Here is your special offer " }
  }
]

const initialEdges = [
  { id: "e1", source: "1", target: "2" },
  { id: "e2", source: "2", target: "3" },
  { id: "e3", source: "3", target: "4" }
]

export default function FlowPage() {

  const searchParams = useSearchParams()        
  const clientId = searchParams.get("clientId") 

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const runFlow = async () => {

    if (!clientId) {                        
      alert("Client ID missing")
      return
    }

    await fetch('/api/flow/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: clientId,                
        nodes
      })
    })

    alert("Automation started")
  }

  return (
    <div style={{ width: "100%", height: "90vh" }}>

      <button
        onClick={runFlow}
        style={{ margin: 10, padding: 10, background: "green", color: "white" }}
      >
        Run Flow
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Background />
        <Controls />
      </ReactFlow>

    </div>
  )
}