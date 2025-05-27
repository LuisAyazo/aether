import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { diagramId: string } }
) {
  try {
    // Verificar que tenemos la URL del backend
    if (!process.env.BACKEND_URL) {
      console.error('BACKEND_URL no está definida en las variables de entorno');
      return NextResponse.json(
        { error: 'Error de configuración: BACKEND_URL no está definida' },
        { status: 500 }
      );
    }

    const url = `${process.env.BACKEND_URL}/api/${params.diagramId}/history`;
    console.log('Intentando conectar a:', url);

    // Verificar que el token de autorización está presente
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No se encontró el header de autorización');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });

    console.log('Status del backend:', response.status);
    
    const data = await response.json();
    console.log('Respuesta del backend:', data);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Error al obtener el historial' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error completo:', error);
    
    // Verificar si es un error de conexión
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'No se pudo conectar con el backend. Verifica que el servidor esté corriendo.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener el historial' },
      { status: 500 }
    );
  }
} 