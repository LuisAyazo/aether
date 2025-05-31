import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Eliminar la cookie del token
    (await
      // Eliminar la cookie del token
      cookies()).delete('github_token');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting from GitHub:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from GitHub' },
      { status: 500 }
    );
  }
} 