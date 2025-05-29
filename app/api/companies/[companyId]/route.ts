import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/companies/${params.companyId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener la información de la compañía');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener la información de la compañía' },
      { status: 500 }
    );
  }
} 