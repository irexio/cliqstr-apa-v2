import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

const redAlertSchema = z.object({
  cliqId: z.string(),
  reason: z.string().optional(),
  contentToSuspend: z.object({
    postIds: z.array(z.string()).optional(),
    userId: z.string().optional(), // Suspend all content from a specific user
    timeRange: z.object({
      startTime: z.number(),
      endTime: z.number(),
    }).optional(), // Suspend content from a time range
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = redAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { cliqId, reason, contentToSuspend } = parsed.data;

    // Get the cliq to find all members
    const cliq = await convexHttp.query(api.cliqs.getCliqBasic, {
      cliqId: cliqId as any,
    });

    if (!cliq) {
      return NextResponse.json(
        { error: 'Cliq not found' },
        { status: 404 }
      );
    }

    // Create Red Alert record first
    const redAlertId = await convexHttp.mutation(api.redAlerts.createRedAlert, {
      cliqId: cliqId as any,
      triggeredById: cliq.ownerId, // For now, use cliq owner as trigger
      reason: reason || 'Safety concern reported',
    });

    // Handle content suspension if specified
    let suspendedContentCount = 0;
    if (contentToSuspend) {
      if (contentToSuspend.postIds && contentToSuspend.postIds.length > 0) {
        // Suspend specific posts
        for (const postId of contentToSuspend.postIds) {
          try {
            await convexHttp.mutation(api.posts.suspendPost, {
              postId: postId as any,
              redAlertId: redAlertId,
              reason: reason || 'Red Alert triggered',
            });
            suspendedContentCount++;
          } catch (error) {
            console.error(`Failed to suspend post ${postId}:`, error);
          }
        }
      }

      if (contentToSuspend.userId) {
        // Suspend all content from a specific user in this cliq
        try {
          const suspendedCount = await convexHttp.mutation(api.posts.suspendUserContent, {
            userId: contentToSuspend.userId as any,
            cliqId: cliqId as any,
            redAlertId: redAlertId,
            reason: reason || 'Red Alert triggered',
          });
          suspendedContentCount += suspendedCount;
        } catch (error) {
          console.error(`Failed to suspend user content for ${contentToSuspend.userId}:`, error);
        }
      }

      if (contentToSuspend.timeRange) {
        // Suspend content from a specific time range
        try {
          const suspendedCount = await convexHttp.mutation(api.posts.suspendContentByTimeRange, {
            cliqId: cliqId as any,
            startTime: contentToSuspend.timeRange.startTime,
            endTime: contentToSuspend.timeRange.endTime,
            redAlertId: redAlertId,
            reason: reason || 'Red Alert triggered',
          });
          suspendedContentCount += suspendedCount;
        } catch (error) {
          console.error(`Failed to suspend content by time range:`, error);
        }
      }
    }

    // Get all members of the cliq
    const memberships = await convexHttp.query(api.memberships.getMembershipsByCliqId, {
      cliqId: cliqId as any,
    });

    // Determine if this is a child or adult report
    const reporterMembership = memberships.find(m => m.userId === cliq.ownerId); // For now, use cliq owner as reporter
    const isChildReport = reporterMembership?.role === 'Child';
    
    // Find all child members and get their parents (only for child reports)
    const childMembers = memberships.filter(m => m.role === 'Child');
    const notifiedParents = new Set<string>(); // Track notified parents to avoid duplicates

    let totalNotifications = 0;

    // Only notify parents if this is a child report
    if (isChildReport) {
      for (const childMember of childMembers) {
        // Get all parent links for this child
        const parentLinks = await convexHttp.query(api.parentLinks.getParentLinksByChildId, {
          childId: childMember.userId,
        });

        // Notify all parents who have notification permissions
        for (const parentLink of parentLinks) {
          // Only notify parents who have notification permissions enabled
          if (parentLink.permissions?.receivesNotifications !== false) {
            // Skip if we've already notified this parent
            if (notifiedParents.has(parentLink.email)) {
              continue;
            }

            // Get parent user details
            let parentEmail = parentLink.email;
            let parentName = 'Parent';

            // If parent has an account, get their name
            if (parentLink.parentId) {
              try {
                const parentUser = await convexHttp.query(api.users.getCurrentUser, {
                  userId: parentLink.parentId,
                });
                if (parentUser?.email) {
                  parentEmail = parentUser.email;
                  if (parentUser.account?.firstName && parentUser.account?.lastName) {
                    parentName = `${parentUser.account.firstName} ${parentUser.account.lastName}`;
                  }
                }
              } catch (error) {
                console.error('Error getting parent user details:', error);
                // Continue with email from parentLink
              }
            }

            // Send Red Alert email
            const subject = '🚨 RED ALERT: Immediate Attention Required';
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #ff0000; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 24px;">🚨 RED ALERT</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px;">Immediate attention required for your child's safety</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #333; margin-top: 0;">Alert Details</h2>
                  <p><strong>Cliq:</strong> ${cliq.name}</p>
                  <p><strong>Child:</strong> ${childMember.userId}</p>
                  <p><strong>Reason:</strong> ${reason || 'Safety concern reported'}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #856404; margin-top: 0;">What to do next:</h3>
                  <ul style="color: #856404; margin: 0; padding-left: 20px;">
                    <li>Log into your Cliqstr Parent HQ immediately</li>
                    <li>Review your child's recent activity</li>
                    <li>Contact your child if appropriate</li>
                    <li>Report any additional concerns to Cliqstr support</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://cliqstr.com'}/parents/hq" 
                     style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Go to Parent HQ
                  </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
                  <p>This is an automated safety alert from Cliqstr. If you have multiple children, you may receive multiple alerts.</p>
                  <p>For immediate assistance, contact: support@cliqstr.com</p>
                </div>
              </div>
            `;

            try {
              const result = await sendEmail({
                to: parentEmail,
                subject,
                html,
              });

              if (result.success) {
                notifiedParents.add(parentLink.email);
                totalNotifications++;
                console.log(`✅ Red Alert sent to ${parentName} (${parentEmail})`);
              } else {
                console.error(`❌ Failed to send Red Alert to ${parentEmail}:`, result.error);
              }
            } catch (error) {
              console.error(`❌ Error sending Red Alert to ${parentEmail}:`, error);
            }
          }
        }
      }
    } else {
      // Adult report - log for AI moderator review (to be implemented later)
      console.log(`🤖 Adult Red Alert reported in cliq ${cliq.name} - will be reviewed by AI moderator`);
    }

    return NextResponse.json({
      success: true,
      message: isChildReport 
        ? 'Red Alert processed successfully - parents notified' 
        : 'Content reported and suspended - will be reviewed by moderation',
      notified: totalNotifications,
      totalParents: notifiedParents.size,
      suspendedContent: suspendedContentCount,
      redAlertId: redAlertId,
      isChildReport: isChildReport,
    });

  } catch (error) {
    console.error('Error processing Red Alert:', error);
    return NextResponse.json(
      { error: 'Failed to process Red Alert' },
      { status: 500 }
    );
  }
}
