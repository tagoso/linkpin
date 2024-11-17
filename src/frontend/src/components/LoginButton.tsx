import { useInternetIdentity } from "ic-use-internet-identity";

export function LoginButton() {
  const { isLoggingIn, login, clear, identity } = useInternetIdentity();

  // If the user is logged in, clear the identity. Otherwise, log in.
  function handleClick() {
    if (identity) {
      clear();
    } else {
      login();
    }
  }

  const text = () => {
    if (identity) {
      return "Logout";
    } else if (isLoggingIn) {
      return (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-0" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
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
    <button onClick={handleClick} disabled={isLoggingIn} className="px-4 py-1 bg-blue-500 text-white rounded mr-2">
      {text()}
    </button>
  );
}
