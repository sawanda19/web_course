import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const diagnostics: string[] = [];
  
  try {
    diagnostics.push('✅ API endpoint reached');
    
    // Step 1: Parse request
    diagnostics.push('Step 1: Parsing request body...');
    let body;
    try {
      body = await req.json();
      diagnostics.push('✅ Body parsed successfully');
    } catch (parseError: any) {
      diagnostics.push('❌ Failed to parse body: ' + parseError.message);
      return NextResponse.json({
        error: 'Invalid request body',
        diagnostics,
      }, { status: 400 });
    }

    const { username, email, password, role } = body;
    diagnostics.push(`Received: ${username}, ${email}, role: ${role || 'student'}, password length: ${password?.length}`);

    // Step 2: Validate
    diagnostics.push('Step 2: Validating input...');
    if (!username || !email || !password) {
      diagnostics.push('❌ Missing fields');
      return NextResponse.json({
        error: 'All fields are required',
        diagnostics,
      }, { status: 400 });
    }

    if (password.length < 6) {
      diagnostics.push('❌ Password too short');
      return NextResponse.json({
        error: 'Password must be at least 6 characters',
        diagnostics,
      }, { status: 400 });
    }
    diagnostics.push('✅ Validation passed');

    // Step 3: Load bcryptjs
    diagnostics.push('Step 3: Loading bcryptjs...');
    let bcrypt;
    try {
      bcrypt = require('bcryptjs');
      diagnostics.push('✅ bcryptjs loaded');
    } catch (e: any) {
      diagnostics.push('❌ Failed to load bcryptjs: ' + e.message);
      return NextResponse.json({
        error: 'Server error: bcrypt missing',
        diagnostics,
      }, { status: 500 });
    }

    // Step 4: Load database module
    diagnostics.push('Step 4: Loading database module...');
    let dbConnect;
    try {
      const dbModule = await import('@/lib/db');
      dbConnect = dbModule.default;
      diagnostics.push('✅ Database module loaded');
    } catch (e: any) {
      diagnostics.push('❌ Failed to load database module: ' + e.message);
      return NextResponse.json({
        error: 'Server error: database module missing',
        diagnostics,
      }, { status: 500 });
    }

    // Step 5: Load User model
    diagnostics.push('Step 5: Loading User model...');
    let User;
    try {
      const userModule = await import('@/models/User');
      User = userModule.default;
      diagnostics.push('✅ User model loaded');
    } catch (e: any) {
      diagnostics.push('❌ Failed to load User model: ' + e.message);
      return NextResponse.json({
        error: 'Server error: User model missing',
        diagnostics,
      }, { status: 500 });
    }

    // Step 6: Connect to database
    diagnostics.push('Step 6: Connecting to database...');
    diagnostics.push('MongoDB URI exists: ' + !!process.env.MONGODB_URI);
    try {
      await dbConnect();
      diagnostics.push('✅ Database connected');
    } catch (dbError: any) {
      diagnostics.push('❌ Database connection failed: ' + dbError.message);
      diagnostics.push('Error name: ' + dbError.name);
      return NextResponse.json({
        error: 'Database connection error',
        details: dbError.message,
        diagnostics,
      }, { status: 500 });
    }

    // Step 7: Check existing user
    diagnostics.push('Step 7: Checking for existing user...');
    let existingUser;
    try {
      existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
      
      if (existingUser) {
        diagnostics.push('❌ User already exists');
        if (existingUser.email === email) {
          return NextResponse.json({
            error: 'Email already registered',
            diagnostics,
          }, { status: 400 });
        }
        return NextResponse.json({
          error: 'Username already taken',
          diagnostics,
        }, { status: 400 });
      }
      diagnostics.push('✅ User does not exist');
    } catch (findError: any) {
      diagnostics.push('❌ Error checking user: ' + findError.message);
      return NextResponse.json({
        error: 'Database query error',
        details: findError.message,
        diagnostics,
      }, { status: 500 });
    }

    // Step 8: Hash password
    diagnostics.push('Step 8: Hashing password...');
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
      diagnostics.push('✅ Password hashed');
    } catch (hashError: any) {
      diagnostics.push('❌ Password hashing failed: ' + hashError.message);
      return NextResponse.json({
        error: 'Password processing error',
        details: hashError.message,
        diagnostics,
      }, { status: 500 });
    }

    // Step 9: Create user
    diagnostics.push('Step 9: Creating user in database...');
    let user;
    try {
      user = await User.create({
        username,
        email,
        password: hashedPassword,
        role: role || 'student', // Use provided role or default to student
      });
      diagnostics.push('✅ User created with ID: ' + user._id);
    } catch (createError: any) {
      diagnostics.push('❌ User creation failed: ' + createError.message);
      diagnostics.push('Error name: ' + createError.name);
      diagnostics.push('Error code: ' + createError.code);
      
      if (createError.code === 11000) {
        return NextResponse.json({
          error: 'User already exists (duplicate key)',
          diagnostics,
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'Failed to create user',
        details: createError.message,
        diagnostics,
      }, { status: 500 });
    }

    diagnostics.push('✅ Signup completed successfully!');
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      diagnostics,
    }, { status: 201 });

  } catch (error: any) {
    diagnostics.push('❌ Unexpected error: ' + error.message);
    diagnostics.push('Error type: ' + error.name);
    
    return NextResponse.json({
      error: 'Unexpected server error',
      details: error.message,
      type: error.name,
      diagnostics,
    }, { status: 500 });
  }
}
