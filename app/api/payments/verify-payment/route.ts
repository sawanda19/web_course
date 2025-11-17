import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import Course from '@/models/Course';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: Request) {
  try {
    console.log('=== VERIFY PAYMENT API CALLED ===');
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    console.log('Session ID received:', sessionId);

    if (!sessionId) {
      console.log('❌ Missing sessionId');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve checkout session from Stripe
    console.log('Fetching Stripe session...');
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Payment status:', checkoutSession.payment_status);

    if (checkoutSession.payment_status !== 'paid') {
      console.log('❌ Payment not completed');
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const { courseId, userId } = checkoutSession.metadata || {};
    console.log('Metadata - courseId:', courseId, 'userId:', userId);

    if (!courseId || !userId) {
      console.log('❌ Missing metadata');
      return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
    }

    await dbConnect();

    // Check if already enrolled
    console.log('Checking existing enrollment...');
    const existingEnrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      console.log('✅ Already enrolled');
      return NextResponse.json({ 
        message: 'Payment verified! You are already enrolled in this course.',
        enrollment: existingEnrollment 
      }, { status: 200 });
    }

    // Get course
    console.log('Fetching course...');
    const course = await Course.findById(courseId);

    if (!course) {
      console.log('❌ Course not found');
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Create enrollment
    console.log('Creating enrollment...');
    const enrollment = await Enrollment.create({
      student: userId,
      course: courseId,
      enrolledAt: new Date(),
      progress: [],
      completedLessons: 0,
      totalLessons: course.lessons?.length || 0,
    });

    console.log('✅ Enrollment created:', enrollment._id);

    // Update user
    console.log('Updating user...');
    await User.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: courseId },
    });

    console.log('✅ Verification complete!');

    return NextResponse.json({
      message: 'Payment verified successfully! You are now enrolled in the course.',
      enrollment,
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}