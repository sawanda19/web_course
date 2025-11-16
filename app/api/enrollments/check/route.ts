import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    await dbConnect();

    const enrollment = await Enrollment.findOne({
      student: session.user.id,
      course: courseId,
    });

    return NextResponse.json({ isEnrolled: !!enrollment }, { status: 200 });
  } catch (error: any) {
    console.error('Check enrollment error:', error);
    return NextResponse.json({ error: 'Failed to check enrollment' }, { status: 500 });
  }
}