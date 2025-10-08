import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[TEST-ROUTE] Route called!');
  return NextResponse.json({ message: 'Test route working!' });
}
