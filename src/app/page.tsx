import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">AI Study Planner</h1>
      <p className="text-lg text-gray-500 max-w-md">
        Upload your study material, set your exam date, and get a clear
        day-by-day study schedule in minutes.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="px-5 py-2.5 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition-colors"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
