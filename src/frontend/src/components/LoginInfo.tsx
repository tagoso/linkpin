export default function LoginInfo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Row for ICP logo and Open Source link */}
      <div className="flex items-center mt-2">
        <img alt="ICP Logo 100% on-chain" className="mt-2 w-60 h-auto" src="/icpLogo.svg" />
      </div>
      <a
        href="https://github.com/your-repository-url"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-800 underline"
      >
        Source Code
      </a>
    </div>
  );
}
