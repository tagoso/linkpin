export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center w-64 h-auto ${className}`}>
      <div className="flex items-center mt-2">
        <img alt="Long Linkpin Logo" className="mb-6" src="/logoLong.png" />
      </div>
    </div>
  );
}
