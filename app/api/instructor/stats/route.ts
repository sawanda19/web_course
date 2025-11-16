import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Instructor only' }, { status: 403 });
    }

    await dbConnect();

    // Find user by email to get correct _id
    const user = await User.findOne({ email: session.user.email }).lean();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const instructorId = user._id.toString();

    // Get instructor's courses
    const courses = await Course.find({ instructor: instructorId }).lean();
    const courseIds = courses.map(c => c._id.toString());

    // Get enrollments for instructor's courses
    const enrollments = await Enrollment.find({ 
      course: { $in: courseIds } 
    }).populate('student', 'username email');

    // Get payments for instructor's courses
    const payments = await Payment.find({ 
      course: { $in: courseIds },
      status: 'succeeded'
    }).lean();

    // Calculate stats
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.published).length;
    const totalStudents = enrollments.length;
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / 100;

    // Get course-specific stats
    const courseStats = courses.map(course => {
      const courseEnrollments = enrollments.filter(e => e.course.toString() === course._id.toString());
      const coursePayments = payments.filter(p => p.course.toString() === course._id.toString());
      const courseRevenue = coursePayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
      
      return {
        _id: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
        price: course.price,
        published: course.published,
        students: courseEnrollments.length,
        revenue: courseRevenue,
        rating: course.rating || 0,
      };
    });

    // Get recent enrollments
    const recentEnrollments = enrollments
      .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
      .slice(0, 5);

    const stats = {
      overview: {
        totalCourses,
        publishedCourses,
        totalStudents,
        totalRevenue,
      },
      courses: courseStats,
      recentEnrollments,
    };

    return NextResponse.json(stats, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get instructor stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}