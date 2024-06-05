export const ContainerBlock = (props: any) => {
    return (
        <div className="md:w-fit md:h-fit m-5 bg-sky-50 dark:bg-slate-900 rounded-3xl w-full">
            {props.children}
        </div>
    )
}

export const ContainerText = (props: any) => {
    return (
        <div className="text-3xl font-bold text-center my-2 mt-5">
            {props.children}
        </div>
    )
}