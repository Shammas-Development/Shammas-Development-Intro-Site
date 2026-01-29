"use client";

import { useEffect } from "react";
import Container from "@/components/Container";
import Button from "@/components/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const Error = ({ error, reset }: ErrorProps) => {
  useEffect(() => {
    // Log the error only in development (Sentry handles production)
    if (process.env.NODE_ENV === "development") {
      console.error("Application error:", error);
    }
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] items-center pt-20 sm:pt-24 lg:pt-32 pb-16">
      <div className="w-full">
        <div className="mx-auto max-w-2xl text-center">
          {/* Error Icon */}
          <div className="relative">
            <p className="font-display text-[8rem] font-bold leading-none text-neutral-100 sm:text-[12rem]">
              500
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-red-100 p-4">
                <svg
                  className="h-12 w-12 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold text-neutral-950 sm:text-4xl">
            Something went wrong
          </h1>
          <p className="mt-4 text-base text-neutral-600">
            We apologize for the inconvenience. An unexpected error occurred while processing your
            request. Our team has been notified.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-left">
              <p className="text-sm font-medium text-red-800">Error Details:</p>
              <p className="mt-1 font-mono text-xs text-red-600">{error.message}</p>
              {error.digest && (
                <p className="mt-1 font-mono text-xs text-red-500">Digest: {error.digest}</p>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button onClick={reset}>
              Try Again
            </Button>
            <Button href="/" invert>
              Go to Homepage
            </Button>
          </div>

          {/* Help Section */}
          <div className="mt-12 rounded-2xl bg-neutral-50 p-6">
            <p className="text-sm font-semibold text-neutral-950">Need help?</p>
            <p className="mt-2 text-sm text-neutral-600">
              If this problem persists, please contact our support team.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <a
                href="mailto:info@shammasdevelopment.io"
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 hover:text-neutral-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@shammasdevelopment.io
              </a>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Error;
