import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    console.log('=== MY-COURSES API START ===');
    console.log('Session:', session);
    console.log('Session user:', session?.user);
    console.log('Session user ID:', session?.user?.id);
    console.log('Session user email:', session?.user?.email);

    if (!session || !session.user) {
      console.log('❌ No session - Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    console.log('✅ DB Connected');

    // First, let's find the actual user in the database
    const dbUser = await User.findOne({ email: session.user.email }).lean();
    console.log('DB User found:', dbUser);
    console.log('DB User _id:', dbUser?._id);
    console.log('DB User _id (string):', dbUser?._id?.toString());

    const userId = dbUser?._id?.toString() || session.user.id;
    console.log('Using userId for query:', userId);

    // Try to find all enrollments for this user
    console.log('Searching enrollments with student:', userId);
    
    const enrollments = await Enrollment.find({ student: userId })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'username email'
        }
      })
      .sort({ enrolledAt: -1 })
      .lean();

    console.log('Enrollments found:', enrollments.length);
    console.log('Enrollments data:', JSON.stringify(enrollments, null, 2));

    // If no enrollments found, let's check what enrollments exist in DB
    if (enrollments.length === 0) {
      console.log('⚠️ No enrollments found! Checking all enrollments...');
      const allEnrollments = await Enrollment.find({}).limit(10).lean();
      console.log('Total enrollments in DB:', allEnrollments.length);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allEnrollments.forEach((e: any, i: number) => {
        console.log(`Enrollment ${i}:`, {
          _id: e._id,
          student: e.student,
          studentString: e.student?.toString(),
          course: e.course,
        });
      });
    }

    console.log('=== MY-COURSES API END ===');
    return NextResponse.json({ enrollments }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Get enrollments error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}