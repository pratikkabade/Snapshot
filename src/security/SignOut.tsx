import { signOut } from "firebase/auth"
import { auth } from "../config/Firebase";

export const SignOut = () => {

    const signOutWithGoogle = async () => {
        await signOut(auth)
    }

    return (
        <div>
            <button className="bg-red-200 dark:bg-red-700 rounded-full  py-1 px-4 hover:brightness-105 text-red-800 dark:text-red-200 font-bold focus:outline-none" onClick={signOutWithGoogle}>
                Sign Out
            </button>
        </div>
    )
}