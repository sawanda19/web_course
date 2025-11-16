import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';

// GET - Отримати enrollment для конкретного курсу
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

    console.log('🔍 Fetching enrollment for user:', session.user.id, 'course:', courseId);

    const enrollment = await Enrollment.findOne({
      student: session.user.id,
      course: courseId,
    }).populate('course');

    if (!enrollment) {
      console.log('❌ Not enrolled in this course');
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 404 });
    }

    console.log('✅ Enrollment found:', enrollment._id);
    return NextResponse.json({ enrollment }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get enrollment error:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollment' }, { status: 500 });
  }
}

// POST - Створити новий enrollment (запис на курс)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if course exists
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: session.user.id,
      course: courseId,
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create progress array for all lessons
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progress = course.lessons.map((lesson: any) => ({
      lessonId: lesson._id.toString(),
      completed: false,
    }));

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: session.user.id,
      course: courseId,
      progress,
      totalLessons: course.lessons.length,
      completedLessons: 0,
      completionPercentage: 0,
      enrolledAt: new Date(),
    });

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 },
    });

    console.log('✅ Enrollment created:', enrollment._id);

    return NextResponse.json(
      { message: 'Enrolled successfully', enrollment },
      { status: 201 }
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Enrollment error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}