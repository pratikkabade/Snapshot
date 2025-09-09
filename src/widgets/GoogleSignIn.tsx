import { auth } from "../config/Firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { SignIn } from "../security/SignIn";
import { SignOut } from "../security/SignOut";
import { Popover } from "flowbite-react";
import { Link } from "react-router-dom";

export const GoogleSignIn = () => {
    const [user] = useAuthState(auth);

    return (
        <div className="mx-5 p-3">
            <div>
                {user ?
                    (
                        <Popover
                            aria-labelledby="profile-popover"
                            content={
                                <div className="bg-gray-50 flex flex-col justify-center items-center p-3">
                                    <h1 className="text-3xl font-semibold mb-3">
                                        {user.displayName}
                                    </h1>
                                    <Link to="/Scheduler" className="text-xl mb-2 hover:underline">
                                        Scheduler
                                    </Link>
                                    <SignOut />
                                </div>
                            }
                        >
                            <div className="flex flex-row align-middle items-center max-sm:p-5">
                                <img src={user.photoURL || ""} alt={user.displayName || "User"} className="rounded-full h-24 lg:rounded-full lg:h-28  w-fit shadow-sm hover:shadow-lg hover:brightness-105 mr-5" />
                                <h1 className="hidden max-sm:flex text-3xl font-semibold">
                                    {user.displayName}
                                </h1>
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