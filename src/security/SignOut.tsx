import { signOut } from "firebase/auth"
import { auth } from "../config/Firebase";

export const SignOut = () => {

    const signOutWithGoogle = async () => {
        await signOut(auth)
    }

    return (
        <div>
            <button className="bg-red-100 rounded-xl hover:bg-red-200 py-1 px-4 text-red-800 hover:text-red-600 dark:text-red-800 dark:hover:text-red-600 font-bold" onClick={signOutWithGoogle}>
                Sign Out
            </button>
        </div>
    )
}