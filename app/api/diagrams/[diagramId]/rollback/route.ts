import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { diagramId: string } }
) {
  try {
    const body = await request.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la versión' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.BACKEND_URL}/diagrams/${params.diagramId}/rollback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({ versionId }),
    });

    if (!response.ok) {
      throw new Error('Error al revertir el diagrama');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al revertir el diagrama' },
      { status: 500 }
    );
  }
} 