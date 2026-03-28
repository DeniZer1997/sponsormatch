import { NextResponse } from 'next/server'

export async function POST() {
  // TODO: Stripe-Integration (Phase 3)
  // Stripe-Account und STRIPE_WEBHOOK_SECRET benötigt
  return NextResponse.json({ error: 'Stripe noch nicht konfiguriert' }, { status: 503 })
}
