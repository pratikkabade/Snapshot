import { Link } from 'react-router-dom';
import { Navbar } from "flowbite-react"

export const ProjectNavbar = () => {
    return (
        <div className="sticky top-0 shadow-sm bg-sky-50 dark:bg-gray-800 z-50">
            <Navbar fluid={true} rounded={true} className="container bg-sky-50 mx-auto">
                <Link
                    className="text-gray-600 hover:text-blue-700 dark:text-gray-200 dark:hover:text-white"
                    to={"/"}>
                    <Navbar.Brand>
                        <img src="https://raw.githubusercontent.com/dependabot-pr/Static-Files/main/Assets/my/Tasks.svg" className="mr-3 h-6 sm:h-9 rounded-lg" alt="Logo" />
                        <span className="self-center whitespace-nowrap text-xl font-semibold">
                            Snapshot
                        </span>
                    </Navbar.Brand>
                </Link>
            </Navbar>
        </div>
    )
}