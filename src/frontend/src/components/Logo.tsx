export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center mt-2">
        <img alt="Long URLL Logo" className="mb-6" src="/logoLong.png" />
      </div>
    </div>
  );
}
