import { auth } from "../config/Firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { SignIn } from "../security/SignIn";
import { SignOut } from "../security/SignOut";
import { Popover } from "flowbite-react";

export const GoogleSignIn = () => {
    const [user] = useAuthState(auth);

    return (
        <div className="mx-5">
            <div>
                {user ?
                    (
                        <Popover
                            aria-labelledby="profile-popover"
                            content={
                                <div className="p-3 bg-gray-50 flex flex-col justify-center items-center">
                                    <h1 className="text-3xl font-semibold mb-3">
                                        {user.displayName}
                                    </h1>
                                    <SignOut />
                                </div>
                            }
                        >
                            <div className="flex flex-col">
                                <img src={user.photoURL} alt={user.displayName} className="rounded-full h-24 lg:rounded-full lg:h-28  w-fit shadow-sm hover:shadow-lg hover:brightness-105" />
                            </div>
                        </Popover>
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