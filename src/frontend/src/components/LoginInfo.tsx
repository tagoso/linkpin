export default function LoginInfo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex justify-center mt-6 mb-4">
        <span className="text-center w-72 h-auto text-lg">Bookmark on Blockchain</span>
      </div>
      {/* Row for ICP logo and Open Source link */}
      <div className="flex justify-center items-center mt-2 w-full">
        <img alt="ICP Logo 100% on-chain" className="h-auto" src="/icpLogo2.png" />
      </div>
      <a
        href="https://github.com/tagoso/linkpin"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-300 underline transition ease-in-out delay-150 hover:text-blue-600 mt-2"
      >
        Source Code
      </a>
    </div>
  );
}
