import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const token = (await cookies()).get('github_token')?.value;

    if (!token) {
      return NextResponse.json({ connected: false });
    }

    // Verificar si el token es válido
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return NextResponse.json({ connected: response.ok });
  } catch (error) {
    console.error('Error checking GitHub connection:', error);
    return NextResponse.json({ connected: false });
  }
} 