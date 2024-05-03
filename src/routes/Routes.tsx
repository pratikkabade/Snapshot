import { Route } from "react-router"
import { BrowserRouter, Routes } from "react-router-dom"
import { Home } from "../pages/Home"
import { NewHome } from "../pages/NewHome"
import { Schedule } from "../widgets/Schedule"

export const Route_Items = [
    { name: "Home", link: "/", element: <NewHome /> },
    { name: "Scheduler", link: "/Scheduler", element: <Schedule /> },
    { name: "OldHome", link: "/OldHome", element: <Home /> },
]

export const Nav_Items = [
    { name: "Home", link: "/" },
]

export const ProjectRoutes = () => {
    return (
        <div className="bg-white text-slate-900 dark:bg-slate-700 dark:text-gray-100">
            <BrowserRouter>

                <Routes>
                    {
                        Route_Items.map((item, index) => {
                            return (
                                <Route
                                    key={index}
                                    path={item.link}
                                    element={item.element} />
                            )
                        })
                    }
                </Routes>

            </BrowserRouter>
        </div>
    )
}