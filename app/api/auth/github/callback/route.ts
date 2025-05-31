import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Este es el objeto codificado en base64

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Decodificar el state para obtener los parámetros originales
  let stateData: { companyId: string; diagramId?: string; environmentId?: string };
  try {
    const decodedState = Buffer.from(state, 'base64').toString('utf-8');
    stateData = JSON.parse(decodedState);
  } catch (error) {
    console.error('Error decoding state:', error);
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  const { companyId, diagramId, environmentId } = stateData;

  try {
    // Intercambiar el código por un token de acceso
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Obtener información del usuario de GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const userData = await userResponse.json();

    // Aquí deberías guardar la información en tu base de datos
    // Por ejemplo, asociar el token de GitHub con la compañía
    // await saveGitHubConnection(state, userData.id, tokenData.access_token);

    // Guardar el token en una cookie segura
    (await cookies()).set('github_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    // Redirigir de vuelta a la página correcta según el contexto
    let redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/company/${companyId}`;
    
    if (diagramId && environmentId) {
      // Si venimos de una página de diagrama específico, redirigir allí
      redirectUrl += `/diagrams/${diagramId}?environmentId=${environmentId}`;
    } else {
      // Si venimos de la página de credenciales general, redirigir allí
      redirectUrl += `/credentials`;
    }
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in GitHub OAuth callback:', error);
    
    // Para la redirección de error, también usar la información decodificada
    let errorRedirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/company/${stateData?.companyId || 'unknown'}`;
    
    if (stateData?.diagramId && stateData?.environmentId) {
      errorRedirectUrl += `/diagrams/${stateData.diagramId}?environmentId=${stateData.environmentId}&error=auth_failed`;
    } else {
      errorRedirectUrl += `/credentials?error=auth_failed`;
    }
    
    return NextResponse.redirect(errorRedirectUrl);
  }
} 