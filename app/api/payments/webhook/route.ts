import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import Course from '@/models/Course';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Webhook secret - різний для local і production
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    console.log('=== WEBHOOK RECEIVED ===');
    
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.log('❌ No signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.log('❌ No webhook secret configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook verified:', event.type);
    } catch (err: any) {
      console.log('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Processing checkout.session.completed');
      console.log('Session ID:', session.id);
      console.log('Metadata:', session.metadata);

      const { courseId, userId, userEmail } = session.metadata || {};

      if (!courseId || !userId) {
        console.log('❌ Missing metadata');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      await dbConnect();

      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: userId,
        course: courseId,
      });

      if (existingEnrollment) {
        console.log('✅ Already enrolled, skipping');
        return NextResponse.json({ received: true });
      }

      // Get course to count lessons
      const course = await Course.findById(courseId);
      
      if (!course) {
        console.log('❌ Course not found');
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      // Create enrollment
      const enrollment = await Enrollment.create({
        student: userId,
        course: courseId,
        enrolledAt: new Date(),
        progress: [],
        completedLessons: 0,
        totalLessons: course.lessons?.length || 0,
      });

      console.log('✅ Enrollment created:', enrollment._id);

      // Update user's enrolled courses
      await User.findByIdAndUpdate(userId, {
        $addToSet: { enrolledCourses: courseId },
      });

      console.log('✅ User updated');
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// Disable body parsing, need raw body for webhook verification
export const dynamic = 'force-dynamic';
