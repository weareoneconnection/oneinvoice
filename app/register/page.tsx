import Link from 'next/link';
import RegisterForm from './RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight">OneInvoice AI</h1>
          <p className="mt-2 text-slate-500">Create your restaurant account</p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-slate-900 underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
