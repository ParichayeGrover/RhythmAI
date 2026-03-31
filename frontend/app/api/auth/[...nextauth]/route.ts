import NextAuth, { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials"; // <-- 1. Import this
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; // <-- 2. Import bcrypt to check the hash

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Your existing GitHub login
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),

    // 3. THE VERIFICATION LOGIC (Manual Login)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // This is the function NextAuth runs when a user clicks "Sign In"
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        // Step A: Find the user in PostgreSQL
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Step B: Security check (Does user exist? Did they sign up via GitHub instead?)
        if (!user || !user.password) {
          throw new Error("No user found with this email, or you signed up with GitHub.");
        }

        // Step C: The Cryptography Check
        // We compare the plain text password they just typed against the scrambled hash in the DB
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Step D: Success! Return the user object. NextAuth will automatically bake this into the JWT cookie.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier // Passing our custom monetization tier into the session!
        };
      }
    })
  ],

  session: {
    strategy: "jwt",
  },

  // 4. Tell NextAuth to use our custom cinematic UI instead of its default ugly pages
  pages: {
    signIn: '/login', 
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };