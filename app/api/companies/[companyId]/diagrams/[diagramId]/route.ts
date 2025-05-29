import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { companyId: string; diagramId: string } }
) {
  try {
    const body = await request.json();
    const { nodes, edges, viewport } = body;

    if (!nodes || !edges) {
      return NextResponse.json(
        { error: 'Se requieren los nodos y las aristas' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.BACKEND_URL}/diagrams/${params.diagramId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({ nodes, edges, viewport }),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el diagrama');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el diagrama' },
      { status: 500 }
    );
  }
} 