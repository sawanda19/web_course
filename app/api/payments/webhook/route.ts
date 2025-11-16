import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified:', event.type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await dbConnect();

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('💳 Checkout session completed:', session.id);
        
        const courseId = session.metadata?.courseId;
        const userId = session.metadata?.userId;
        const userEmail = session.metadata?.userEmail || session.customer_email;

        if (!courseId || !userId) {
          console.error('❌ Missing metadata in checkout session');
          break;
        }

        // Create or update payment record
        await Payment.findOneAndUpdate(
          { sessionId: session.id },
          {
            user: userId,
            course: courseId,
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            status: 'succeeded',
            sessionId: session.id,
            paymentIntentId: session.payment_intent as string,
            email: userEmail as string,
          },
          { upsert: true, new: true }
        );

        console.log('💾 Payment record created/updated');

        // Get course to create enrollment with lessons
        const course = await Course.findById(courseId);
        
        if (!course) {
          console.error('❌ Course not found:', courseId);
          break;
        }

        console.log('📚 Course found:', course.title);

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          student: userId,
          course: courseId,
        });

        if (existingEnrollment) {
          console.log('ℹ️ User already enrolled in this course');
          break;
        }

        // Create progress array for all lessons
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const progress = course.lessons.map((lesson: any) => ({
          lessonId: lesson._id.toString(),
          completed: false,
        }));

        // Create new enrollment
        const enrollment = await Enrollment.create({
          student: userId,
          course: courseId,
          progress,
          totalLessons: course.lessons.length,
          completedLessons: 0,
          completionPercentage: 0,
          enrolledAt: new Date(),
        });

        console.log('✅ Enrollment created:', enrollment._id);

        // Update course enrollment count
        await Course.findByIdAndUpdate(courseId, {
          $inc: { enrollmentCount: 1 },
        });

        console.log('📈 Course enrollment count updated');
        console.log('🎉 Payment succeeded and enrollment created for session:', session.id);
        break;
      }

      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any;
        
        console.log('❌ Payment failed:', session.id);
        
        await Payment.findOneAndUpdate(
          { sessionId: session.id || `failed_${session.payment_intent}` },
          {
            status: 'failed',
            sessionId: session.id || `failed_${session.payment_intent}`,
          },
          { upsert: true }
        );

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('⏰ Session expired:', session.id);
        
        await Payment.findOneAndUpdate(
          { sessionId: session.id },
          { status: 'canceled' },
          { upsert: true }
        );

        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('💥 Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}