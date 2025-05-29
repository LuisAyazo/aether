import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { companyId: string; diagramId: string } }
) {
  try {
    const body = await request.json();
    const { description, changes } = body;

    if (!description || !changes) {
      return NextResponse.json(
        { error: 'Se requieren la descripción y los cambios' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.BACKEND_URL}/diagrams/${params.diagramId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({ description, changes }),
    });

    if (!response.ok) {
      throw new Error('Error al crear la versión');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al crear la versión' },
      { status: 500 }
    );
  }
} 