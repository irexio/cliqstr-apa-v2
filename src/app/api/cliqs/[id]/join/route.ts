/**
 * 🔐 APA-HARDENED CONVEX ROUTE: POST /api/cliqs/[id]/join
 *
 * Purpose:
 *   - Allows users to join a cliq with age gating validation
 *   - Enforces APA-safe age restrictions using Account.birthdate
 *   - Validates parental controls for children
 *
 * Auth:
 *   - Requires valid session (user.id)
 *   - Uses Account.birthdate for age verification (immutable)
 *
 * Age Gating Logic:
 *   - Check cliq.minAge and cliq.maxAge against user's Account.birthdate
 *   - For children: validate canJoinPublicCliqs permission
 *   - Reject if age requirements not met
 *
 * Returns:
 *   - 200 OK + membership created
 *   - 401 if unauthorized
 *   - 403 if age restriction not met or parent permission denied
 *   - 409 if already a member
 *   - 500 on error
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { validateAgeRequirements } from '@/lib/utils/ageUtils';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cliqId } = await params;
    
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 Security check: User must have a valid plan to join ANY cliq
    if (!user.plan) {
      console.error('[SECURITY] User attempted to join cliq without plan:', {
        userId: user.id,
        email: user.email,
        cliqId
      });
      return NextResponse.json({ error: 'Account setup incomplete - no plan assigned' }, { status: 403 });
    }

    // Get user's Account data for age verification (APA-safe)
    if (!user.account?.birthdate) {
      console.log('[APA] User missing account birthdate in cliq join:', user.email);
      return NextResponse.json({ 
        error: 'Account setup incomplete' 
      }, { status: 403 });
    }

    // Get cliq with age restrictions using Convex
    const cliq = await convexHttp.query(api.cliqs.getCliqBasic, {
      cliqId: cliqId as any,
    });

    if (!cliq) {
      return NextResponse.json({ error: 'Cliq not found' }, { status: 404 });
    }

    // Check if already a member using Convex
    const isMember = await convexHttp.query(api.cliqs.isCliqMember, {
      userId: user.id as any,
      cliqId: cliqId as any,
    });

    if (isMember) {
      return NextResponse.json({ 
        error: 'You are already a member of this cliq' 
      }, { status: 409 });
    }

    // Age gating validation using Account.birthdate (APA-safe)
    const ageValidation = validateAgeRequirements(
      new Date(user.account.birthdate),
      cliq.minAge,
      cliq.maxAge
    );

    if (!ageValidation.isValid) {
      console.log(`[APA] Age restriction blocked user ${user.id} from cliq ${cliqId}:`, ageValidation.reason);
      return NextResponse.json({ 
        error: `Age restriction: ${ageValidation.reason}` 
      }, { status: 403 });
    }

    // For public/semi-private cliqs, check child permissions
    if ((cliq.privacy === 'public' || cliq.privacy === 'semi_private') && 
        user.account.role?.toLowerCase() === 'child') {
      
      // Get child settings to check parental permissions using Convex
      const childSettings = await convexHttp.query(api.users.getChildSettings, {
        profileId: user.myProfile?.id as any,
      });

      if (!childSettings?.canJoinPublicCliqs) {
        console.log(`[APA] Child blocked from joining ${cliq.privacy} cliq:`, user.email);
        return NextResponse.json({
          error: 'You need parent permission to join public or semi-private cliqs'
        }, { status: 403 });
      }
    }

    // Create membership using Convex
    const membershipId = await convexHttp.mutation(api.cliqs.joinCliq, {
      userId: user.id as any,
      cliqId: cliqId as any,
      role: 'Member',
    });

    console.log(`[JOIN_CLIQ_SUCCESS] User ${user.id} joined cliq ${cliqId} (age: ${ageValidation.userAge})`);
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully joined ${cliq.name}`,
      membershipId,
      userAge: ageValidation.userAge
    });

  } catch (error) {
    console.error('[JOIN_CLIQ_ERROR]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
