import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { lessonId, completed } = await req.json();

    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    if (enrollment.student.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this enrollment' },
        { status: 403 }
      );
    }

    const progressIndex = enrollment.progress.findIndex(
      (p: any) => p.lessonId === lessonId
    );

    if (progressIndex === -1) {
      return NextResponse.json(
        { error: 'Lesson not found in enrollment' },
        { status: 404 }
      );
    }

    enrollment.progress[progressIndex].completed = completed;

    if (completed) {
      enrollment.progress[progressIndex].completedAt = new Date();
    } else {
      enrollment.progress[progressIndex].completedAt = undefined;
    }

    const completedCount = enrollment.progress.filter(
      (p: any) => p.completed
    ).length;

    enrollment.completedLessons = completedCount;
    enrollment.completionPercentage =
      enrollment.totalLessons > 0
        ? Math.round((completedCount / enrollment.totalLessons) * 100)
        : 0;

    enrollment.completedAt =
      completedCount === enrollment.totalLessons && enrollment.totalLessons > 0
        ? new Date()
        : undefined;

    await enrollment.save();

    return NextResponse.json(
      { message: 'Progress updated', enrollment },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
