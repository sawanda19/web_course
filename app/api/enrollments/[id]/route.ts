import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';

// PUT /api/enrollments/[id] - Update lesson progress
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { lessonId, completed } = await req.json();

    const enrollment = await Enrollment.findById(params.id);

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Check if user owns this enrollment
    if (enrollment.student.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this enrollment' },
        { status: 403 }
      );
    }

    // Update progress
    const progressIndex = enrollment.progress.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Recalculate completion stats
    const completedCount = enrollment.progress.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.completed
    ).length;
    enrollment.completedLessons = completedCount;
    enrollment.completionPercentage =
      enrollment.totalLessons > 0
        ? Math.round((completedCount / enrollment.totalLessons) * 100)
        : 0;

    // Mark as completed if all lessons done
    if (completedCount === enrollment.totalLessons && enrollment.totalLessons > 0) {
      enrollment.completedAt = new Date();
    } else {
      enrollment.completedAt = undefined;
    }

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