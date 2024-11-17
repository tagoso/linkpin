import { Entry } from "./components/Entry";
import { LoginButton } from "./components/LoginButton";
import Principal from "./components/Principal";
import { useInternetIdentity } from "ic-use-internet-identity";
import LoginInfo from "./components/LoginInfo";
import Logo from "./components/Logo";

function App() {
  const { identity } = useInternetIdentity();

  // Get the principal (user ID) from the identity directly
  const principal = identity ? identity.getPrincipal().toText() : undefined;

  return (
    <div className="flex flex-col w-full min-h-screen poppins text-base bg-gradient-to-b from-pink-50 to-pink-100">
      {identity ? (
        <div className="flex flex-col w-full gap-5 p-10 sm:p-10 md:p-16 lg:p-16 items-start">
          <div className="flex items-center">
            <LoginButton />
            <Principal principal={principal} />
          </div>
          <Entry />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-grow max-h-full">
          <Logo className="w-60 h-auto" />
          <LoginButton />
          <LoginInfo className="w-60 h-auto" />
          <div className="mt-6"></div>
        </div>
      )}
    </div>
  );
}

export default App;
