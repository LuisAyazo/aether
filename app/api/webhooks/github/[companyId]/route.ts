import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const payload = await request.text();
    
    // Verificar la firma del webhook
    if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
    const digest = hmac.update(payload).digest('hex');
    const calculatedSignature = `sha256=${digest}`;

    if (signature !== calculatedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = request.headers.get('x-github-event');
    const data = JSON.parse(payload);

    // Procesar diferentes tipos de eventos
    switch (event) {
      case 'push':
        // Manejar evento de push
        console.log('Push event received:', {
          repo: data.repository.full_name,
          branch: data.ref,
          commit: data.head_commit.id,
          companyId: params.companyId
        });
        break;

      case 'pull_request':
        // Manejar evento de pull request
        console.log('Pull request event received:', {
          repo: data.repository.full_name,
          action: data.action,
          prNumber: data.pull_request.number,
          companyId: params.companyId
        });
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 