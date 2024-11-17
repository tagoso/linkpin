import { useInternetIdentity } from "ic-use-internet-identity";

export function LoginButton() {
  const { isLoggingIn, login, clear, identity } = useInternetIdentity();

  // Handle login or logout click
  function handleClick() {
    if (identity) {
      handleLogout(); // Use the handleLogout function for logout
    } else {
      login();
    }
  }

  // Logout function to clear states and optionally reload the page
  function handleLogout() {
    clear(); // Clear Internet Identity session
    // Optionally force reload the page to reset all states
    window.location.reload();
  }

  // Render button text based on the login state
  const text = () => {
    if (identity) {
      return "Logout";
    } else if (isLoggingIn) {
      return (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-0" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </>
      );
    }
    return "Login";
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoggingIn}
      className={`${
        identity
          ? "px-4 py-1 bg-blue-400 text-white rounded mr-4" // Logout button (current style)
          : "px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200" // Login button (new style)
      }`}
    >
      {text()}
    </button>
  );
}
