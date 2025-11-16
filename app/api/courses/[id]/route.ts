import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findById(id).populate('instructor', 'username email');

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get course error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user is the instructor or admin
    if (
      course.instructor.toString() !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this course' },
        { status: 403 }
      );
    }

    const updateData = await req.json();

    // Calculate total duration if lessons are updated
    if (updateData.lessons) {
      const totalDuration = updateData.lessons.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, lesson: any) => sum + (lesson.duration || 0),
        0
      );
      updateData.totalDuration = totalDuration;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      { message: 'Course updated successfully', course: updatedCourse },
      { status: 200 }
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Update course error:', error);
    
    if (error.name === 'ValidationError') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user is the instructor or admin
    if (
      course.instructor.toString() !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this course' },
        { status: 403 }
      );
    }

    // Delete all enrollments for this course
    await Enrollment.deleteMany({ course: id });

    // Delete the course
    await Course.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Course deleted successfully' },
      { status: 200 }
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Delete course error:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}