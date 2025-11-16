import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    await dbConnect();

    // Get counts
    const [
      totalUsers,
      totalInstructors,
      totalStudents,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalPayments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'instructor' }),
      User.countDocuments({ role: 'student' }),
      Course.countDocuments(),
      Course.countDocuments({ published: true }),
      Enrollment.countDocuments(),
      Payment.countDocuments({ status: 'succeeded' }),
    ]);

    // Calculate total revenue
    const paymentsData = await Payment.find({ status: 'succeeded' }).select('amount');
    const totalRevenue = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0) / 100; // Convert cents to dollars

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email role createdAt');

    // Get recent enrollments
    const recentEnrollments = await Enrollment.find()
      .sort({ enrolledAt: -1 })
      .limit(5)
      .populate('student', 'username email')
      .populate('course', 'title');

    const stats = {
      users: {
        total: totalUsers,
        instructors: totalInstructors,
        students: totalStudents,
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        unpublished: totalCourses - publishedCourses,
      },
      enrollments: {
        total: totalEnrollments,
      },
      revenue: {
        total: totalRevenue,
        payments: totalPayments,
      },
      recent: {
        users: recentUsers,
        enrollments: recentEnrollments,
      },
    };

    return NextResponse.json(stats, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}