import { auth } from "../config/Firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { SignIn } from "../security/SignIn";
import { SignOut } from "../security/SignOut";

export const GoogleSignIn = () => {
    const [user] = useAuthState(auth);

    return (
        <div className="w-64">
            <div>
                {user ?
                    (
                        <div className="flex flex-col">
                            <SignOut />
                            <h1>Welcome {user.displayName}</h1>
                            <img src={user.photoURL} alt={user.displayName} className="rounded-xl h-24 lg:rounded-3xl lg:h-32 w-fit shadow-sm hover:shadow-md hover:brightness-105" />
                        </div>
                    )
                    :
                    (
                        <>
                            <SignIn />
                        </>
                    )
                }
            </div>
        </div>
    )
}