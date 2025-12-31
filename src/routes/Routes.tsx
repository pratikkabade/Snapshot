import { Route, useLocation } from "react-router"
import { BrowserRouter, Routes } from "react-router-dom"
import { Home } from "../pages/Home"
import { NewHome } from "../pages/NewHome"
import { Schedule } from "../widgets/Schedule"
import { ProjectNavbar } from "../components/layout/Navbar"
import TaskManager from "../widgets/tasks/TaskManager"
import NoteManager from "../widgets/notes/NoteManager"
import Clipboard from "../widgets/Clipboard"
import ContactManager from "../widgets/ContactManager"
import BookmarkManager from "../widgets/BookmarkManager"
import TimeTracker from "../widgets/TimeTracker"
import RoadmapManager from "../widgets/notes/Roadmap"

export const Route_Items = [
    { name: "Home", link: "/", element: <NewHome /> },
    { name: "Scheduler", link: "/Scheduler", element: <Schedule /> },
    { name: "Tasks", link: "/Tasks", element: <TaskManager /> },
    { name: "Notes", link: "/Notes", element: <NoteManager /> },
    { name: "Clipboard", link: "/Clipboard", element: <Clipboard /> },
    { name: "Contacts", link: "/Contacts", element: <ContactManager /> },
    { name: "Bookmarks", link: "/Bookmarks", element: <BookmarkManager /> },
    { name: "TimeTracker", link: "/TimeTracker", element: <TimeTracker /> },
    { name: "RoadmapManager", link: "/RoadmapManager", element: <RoadmapManager /> },

    { name: "OldHome", link: "/OldHome", element: <Home /> },
]

export const Nav_Items = [
    { name: "Home", link: "/" },
]

export const ProjectRoutes = () => {
    return (
        <BrowserRouter>
            <InnerRoutes />
        </BrowserRouter>
    );
};

const InnerRoutes = () => {
    const location = useLocation();
    const NOTHomePage = !["/"].includes(location.pathname);

    return (
        <div className="dark:bg-gray-900">
            {NOTHomePage && (
                <div className="mb-10">
                    {/* Navbar component */}
                    <ProjectNavbar />
                </div>
            )}

            <Routes>
                {Route_Items.map((item, index) => (
                    <Route key={index} path={item.link} element={item.element} />
                ))}
            </Routes>

        </div>
    );
};