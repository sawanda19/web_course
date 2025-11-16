import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!user) throw new Error("Invalid email or password");

        const valid = await user.comparePassword(credentials.password);
        if (!valid) throw new Error("Invalid email or password");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.username,
          role: user.role as "student" | "instructor" | "admin",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as "student" | "instructor" | "admin";
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "student" | "instructor" | "admin";
      return session;
    },
  },

  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
