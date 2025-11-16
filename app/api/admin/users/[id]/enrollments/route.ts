import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params = await context.params;
    const userId = params.id;

    await dbConnect();

    const enrollments = await Enrollment.find({ student: userId })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'username email'
        }
      })
      .sort({ enrolledAt: -1 });

    return NextResponse.json({ enrollments }, { status: 200 });
  } catch (error: any) {
    console.error('Get user enrollments error:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}