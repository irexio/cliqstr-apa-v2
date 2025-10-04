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

    // Determine trigger type based on user role
    // For now, we'll need to get the user's role to determine if it's child or adult
    // This will be updated when we have proper user context
    // TODO: Get actual user role from session/context
    const getTriggerType = (): "child" | "adult" | "ai" => {
      // For now, default to child - this will be updated with proper user context
      return "child";
    };
    const triggerType = getTriggerType();

    // Create Red Alert record first
    const redAlertId = await convexHttp.mutation(api.redAlerts.createRedAlert, {
      cliqId: cliqId as any,
      triggeredById: cliq.ownerId, // For now, use cliq owner as trigger
      reason: reason || 'Safety concern reported',
      triggerType: triggerType as any,
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
    const memberships = await convexHttp.query(api.cliqs.getMembershipsByCliqId, {
      cliqId: cliqId as any,
    });

    // Find all child members and get their parents
    const childMembers = memberships.filter(m => m.role === 'Child');
    const notifiedParents = new Set<string>(); // Track notified parents to avoid duplicates

    let totalNotifications = 0;

    // Notify parents based on trigger type
    if (triggerType === "child" || triggerType === "ai") {
      for (const childMember of childMembers) {
        // Get all parent links for this child
        const parentLinks = await convexHttp.query(api.parentLinks.getParentLinksByChildId, {
          childId: childMember.userId,
        });

        // For AI-triggered alerts, check if parents want to receive them
        if (triggerType === "ai") {
          // Get child settings to check receiveAiAlerts
          const childProfile = await convexHttp.query(api.profiles.getProfileByUserId, {
            userId: childMember.userId,
          });
          
          if (childProfile) {
            const childSettings = await convexHttp.query(api.users.getChildSettings, {
              profileId: childProfile._id,
            });
            
            // Skip if parents don't want AI alerts
            if (childSettings && !childSettings.receiveAiAlerts) {
              console.log(`Skipping AI alert notification for child ${childMember.userId} - parents disabled AI alerts`);
              continue;
            }
          }
        }

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

            // Send Red Alert notifications (email + future SMS via Twilio)
            const subject = triggerType === "ai" ? '🚨 AI Red Alert' : '🚨 Red Alert';
            
            // Get child name for display
            const childProfile = await convexHttp.query(api.profiles.getProfileByUserId, {
              userId: childMember.userId,
            });
            const childName = childProfile?.username || childMember.userId;
            
            let html = '';
            
            if (triggerType === "ai") {
              // AI-triggered alert template
              html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #ff0000; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px;">🚨 AI Red Alert</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">
                      Cliqstr's AI system flagged and suspended content in a cliq.
                    </p>
                  </div>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #333; margin-top: 0;">Alert Details</h2>
                    <p><strong>Cliq:</strong> ${cliq.name}</p>
                    <p><strong>Reason flagged:</strong> ${reason || 'Content flagged by AI'}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  
                  <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #856404; margin-top: 0;">What this means:</h3>
                    <ul style="color: #856404; margin: 0; padding-left: 20px;">
                      <li>AI Moderation can sometimes be over-sensitive</li>
                      <li>Our moderation team is reviewing this alert now</li>
                      <li>You may wish to check in with your child and review the cliq</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://cliqstr.com/parents/hq" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                      Review in Parent HQ
                    </a>
                  </div>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
                    <p>This alert was triggered automatically by Cliqstr's AI moderation system. Our moderators will confirm whether this content requires further action.</p>
                  </div>
                </div>
              `;
            } else {
              // Child-triggered alert template
              html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #ff0000; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px;">🚨 Red Alert</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">
                      Your child just activated Red Alert in a cliq.
                    </p>
                  </div>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #333; margin-top: 0;">Alert Details</h2>
                    <p><strong>Cliq:</strong> ${cliq.name}</p>
                    <p><strong>Child:</strong> ${childName}</p>
                    <p><strong>Reason:</strong> ${reason || 'Safety concern reported'}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  
                  <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #856404; margin-top: 0;">What to do next:</h3>
                    <ul style="color: #856404; margin: 0; padding-left: 20px;">
                      <li>Check in with your child as soon as possible</li>
                      <li>Review suspended content in Parent HQ</li>
                      <li>Decide together if this was a misunderstanding or a real concern</li>
                      <li>Reach out to Cliqstr support if you need further help</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://cliqstr.com/parents/hq" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                      Review in Parent HQ
                    </a>
                  </div>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
                    <p>This alert was triggered by your child pressing the Red Alert button. Our goal is to keep you informed and give you tools to respond quickly and confidently.</p>
                  </div>
                </div>
              `;
            }

            try {
              // Send email notification
              const emailResult = await sendEmail({
                to: parentEmail,
                subject,
                html,
              });

              if (emailResult.success) {
                console.log(`✅ Red Alert email sent to ${parentName} (${parentEmail})`);
              } else {
                console.error(`❌ Failed to send Red Alert email to ${parentEmail}:`, emailResult.error);
              }

              // TODO: Add Twilio SMS notification when implemented
              // const smsResult = await sendSMS({
              //   to: parentPhoneNumber, // Get from parent profile
              //   message: `🚨 RED ALERT: Safety concern reported in ${cliq.name}. Check your email immediately.`
              // });

              if (emailResult.success) {
                notifiedParents.add(parentLink.email);
                totalNotifications++;
                console.log(`✅ Red Alert notifications sent to ${parentName} (${parentEmail})`);
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

    // Always notify Cliqstr moderation team
    try {
      const moderationSubject = '🚨 RED ALERT: Content Reported for Review';
      const moderationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ff0000; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🚨 RED ALERT - MODERATION REQUIRED</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">
              An adult user has reported content. Review required.
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Alert Details</h2>
            <p><strong>Cliq ID:</strong> ${cliqId}</p>
            <p><strong>Cliq Name:</strong> ${cliq.name}</p>
            <p><strong>Reported By:</strong> ${cliq.ownerId}</p>
            <p><strong>Reason:</strong> ${reason || 'Safety concern reported'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Suspended Content Count:</strong> ${suspendedContentCount}</p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #856404; margin-top: 0;">Required Actions:</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Review the reported content and context</li>
              <li>Check AI moderation results (if available)</li>
              <li>Decide if this violates Cliqstr conduct rules</li>
              <li>Take appropriate action (restore, delete, escalate)</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            <p>This alert was sent to the Cliqstr moderation team (<strong>redalert@cliqstr.com</strong>). Do not forward outside of authorized staff.</p>
          </div>
        </div>
      `;

      const moderationResult = await sendEmail({
        to: 'redalert@cliqstr.com',
        subject: moderationSubject,
        html: moderationHtml,
      });

      if (moderationResult.success) {
        console.log(`✅ Red Alert notification sent to moderation team`);
      } else {
        console.error(`❌ Failed to send Red Alert to moderation team:`, moderationResult.error);
      }
    } catch (error) {
      console.error(`❌ Error sending Red Alert to moderation team:`, error);
    }

    return NextResponse.json({
      success: true,
      message: triggerType === "child" || triggerType === "ai"
        ? 'Red Alert processed successfully - parents notified' 
        : 'Content reported and suspended - will be reviewed by moderation',
      notified: totalNotifications,
      totalParents: notifiedParents.size,
      suspendedContent: suspendedContentCount,
      redAlertId: redAlertId,
      triggerType: triggerType,
    });

  } catch (error) {
    console.error('Error processing Red Alert:', error);
    return NextResponse.json(
      { error: 'Failed to process Red Alert' },
      { status: 500 }
    );
  }
}
