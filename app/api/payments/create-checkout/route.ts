import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Course from '@/models/Course';
import User from '@/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function POST(req: Request) {
  try {
    console.log('=== CREATE CHECKOUT SESSION ===');
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await req.json();
    console.log('Course ID:', courseId);
    console.log('User:', session.user.email);

    if (!courseId) {
      console.log('❌ Missing courseId');
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Get course
    const course = await Course.findById(courseId);

    if (!course) {
      console.log('❌ Course not found');
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    console.log('✅ Course found:', course.title);
    console.log('Price:', course.price);

    // Get user ID from database
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    console.log('✅ User ID:', userId);

    // Check if price is 0 - free course
    if (course.price === 0) {
      console.log('💰 Free course - no payment needed');
      return NextResponse.json({ 
        url: `/courses/${courseId}?enrolled=true`,
        isFree: true 
      }, { status: 200 });
    }

    console.log('💳 Creating Stripe checkout session...');

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    console.log('Base URL:', baseUrl);

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description.substring(0, 200), // Limit description length
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/courses/${courseId}`,
      metadata: {
        courseId: courseId,
        userId: userId,
        userEmail: session.user.email || '',
      },
      customer_email: session.user.email || undefined,
    });

    console.log('✅ Checkout session created:', checkoutSession.id);
    console.log('URL:', checkoutSession.url);

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Create checkout error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}