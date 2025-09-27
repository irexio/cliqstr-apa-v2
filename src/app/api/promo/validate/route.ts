import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const promoCodeSchema = z.object({
  promoCode: z.string().min(1, 'Promo code is required').max(50, 'Promo code too long'),
});

/**
 * POST /api/promo/validate
 * 
 * Validate a promo code through Stripe
 * Returns discount information if valid
 */
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = promoCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid promo code format' 
      }, { status: 400 });
    }

    const { promoCode } = parsed.data;
    const normalizedCode = promoCode.trim().toUpperCase();

    console.log(`[PROMO_VALIDATE] Validating promo code: ${normalizedCode} for user: ${session.userId}`);

    // TODO: Integrate with Stripe promo codes/coupons
    // For now, we'll simulate validation with some test codes
    const validPromoCodes = {
      'WELCOME10': {
        type: 'percentage',
        value: 10,
        description: '10% off your first month'
      },
      'FAMILY2025': {
        type: 'percentage', 
        value: 20,
        description: '20% off family plans'
      },
      'TRIAL30': {
        type: 'fixed',
        value: 5,
        description: '$5 off your subscription'
      }
    };

    const discount = validPromoCodes[normalizedCode as keyof typeof validPromoCodes];

    if (!discount) {
      return NextResponse.json({ 
        error: 'Invalid or expired promo code' 
      }, { status: 400 });
    }

    console.log(`✅ Promo code ${normalizedCode} is valid:`, discount);

    return NextResponse.json({ 
      success: true,
      promoCode: normalizedCode,
      discount,
      message: `Promo code applied! ${discount.description}`
    });

  } catch (error: any) {
    console.error('[PROMO_VALIDATE] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to validate promo code. Please try again.' 
    }, { status: 500 });
  }
}

/**
 * TODO: Replace the mock validation above with actual Stripe integration:
 * 
 * import Stripe from 'stripe';
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
 * 
 * // Validate promo code with Stripe
 * const promotionCode = await stripe.promotionCodes.list({
 *   code: normalizedCode,
 *   active: true,
 *   limit: 1
 * });
 * 
 * if (promotionCode.data.length === 0) {
 *   return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
 * }
 * 
 * const code = promotionCode.data[0];
 * const coupon = await stripe.coupons.retrieve(code.coupon.id);
 * 
 * return NextResponse.json({
 *   success: true,
 *   promoCode: normalizedCode,
 *   discount: {
 *     type: coupon.amount_off ? 'fixed' : 'percentage',
 *     value: coupon.amount_off ? coupon.amount_off / 100 : coupon.percent_off,
 *     description: coupon.name || 'Discount applied'
 *   }
 * });
 */
