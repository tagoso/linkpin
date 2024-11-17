import Spinner from "./Spinner";
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
          <Spinner/>
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
