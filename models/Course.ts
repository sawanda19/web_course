import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILesson {
  _id?: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number; // in minutes
  order: number;
  isFree?: boolean;
}

export interface ICourse extends Document {
  _id: string;
  title: string;
  description: string;
  instructor: mongoose.Types.ObjectId;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  thumbnail: string;
  lessons: ILesson[];
  totalDuration?: number; // in minutes
  enrollmentCount: number;
  rating: number;
  reviews: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
  },
  description: {
    type: String,
    default: '',
  },
  videoUrl: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 0,
  },
  order: {
    type: Number,
    required: true,
  },
  isFree: {
    type: Boolean,
    default: false,
  },
});

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Programming',
        'Design',
        'Business',
        'Marketing',
        'Photography',
        'Music',
        'Language',
        'Other',
      ],
    },
    level: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    thumbnail: {
      type: String,
      required: [true, 'Thumbnail is required'],
    },
    lessons: [LessonSchema],
    totalDuration: {
      type: Number,
      default: 0,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;