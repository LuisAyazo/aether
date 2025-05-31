import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const diagramId = searchParams.get('diagramId');
  const environmentId = searchParams.get('environmentId');

  if (!companyId) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`;
  
  // Create state object with all context parameters
  const stateData = {
    companyId,
    ...(diagramId && { diagramId }),
    ...(environmentId && { environmentId })
  };
  
  // Encode the state as base64 to handle complex objects
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,admin:repo_hook&state=${state}`;
  
  return NextResponse.redirect(githubAuthUrl);
} 