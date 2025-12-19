import { HiOutlineCheck, HiOutlineDocumentDuplicate, HiArchive } from "react-icons/hi";
import { Button } from "flowbite-react";

// Types
interface ClipboardItem {
    id: string;
    content: string;
    created: Date | null;
}

interface renderItemsProps {
    clipboardItems: ClipboardItem[];
    itemSelected: string | null;
    copyItem: (item: ClipboardItem) => void;
    removeItem: (id: string) => void;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    renderPasteFromClipboard: () => JSX.Element;
    formatDate: (date: Date) => string;
}

export const renderItems = ({
    clipboardItems,
    itemSelected,
    copyItem,
    removeItem,
    expandedId,
    setExpandedId,
    renderPasteFromClipboard,
    formatDate,
}: renderItemsProps) => (
    <div>
        {renderPasteFromClipboard()}
        <ul className={`fade-in2 rounded-lg overflow-y-auto overflow-x-auto h-full`}>
            {clipboardItems.map((item) => {
                const isSelected = item.id === itemSelected;
                const isExpanded = expandedId === item.id;
                return (
                    <li key={item.id} className={`p-3 bg-gray-50 dark:bg-gray-700 my-2 rounded-xl bg-white/80 backdrop-blur-md text- border border-gray-200 dark:border-gray-600 duration-200 hover:shadow-md transition-shadow max-w-96 w-full h-fit group ${isSelected
                        ? "bg-green-200 dark:bg-green-800 border-green-400 dark:border-green-600 hover:border-green-500 text-green-600 dark:text-green-200"
                        : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white"
                        }`}>
                        <div onClick={() => copyItem(item)} className={`whitespace-pre-wrap break-words p-1 rounded-xl text-sm hover:text-green-500 dark:hover:text-green-400 cursor-pointer`}>
                            {isExpanded ? (
                                <div className="max-h-28 overflow-y-auto pr-2 break-words">
                                    {item.content}
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedId(null);
                                        }}
                                        className="block mt-2 text-blue-500 font-medium cursor-pointer hover:underline"
                                    >
                                        Show less
                                    </span>
                                </div>
                            ) : (
                                <>
                                    {item.content.length > 150
                                        ? item.content.slice(0, 150) + "…"
                                        : item.content}
                                    {item.content.length > 150 && (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedId(item.id);
                                            }}
                                            className="text-blue-500 font-medium ml-1 cursor-pointer hover:underline"
                                        >
                                            Show more
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-medium text-sm text-gray-500">
                                {formatDate(item.created!)}
                            </span>
                            <div className="flex flex-row gap-2">
                                <div onClick={() => copyItem(item)} className={`hidden group-hover:flex border rounded-full px-2 flex-row items-center text-lg cursor-pointer ${isSelected ? 'bg-green-200 dark:bg-green-600 border-green-400 dark:border-green-600 hover:brightness-105' : 'bg-green-100 dark:bg-green-800 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-700 hover:border-green-300 dark:hover:border-green-600'}`}>
                                    {isSelected ? <HiOutlineCheck className="fade-in text-green-700 dark:text-green-300 hidden group-hover:block" /> :
                                        <HiOutlineDocumentDuplicate className="fade-in text-green-500 dark:text-green-200 hidden group-hover:block" />}
                                </div>
                                <Button
                                    size="xs"
                                    pill
                                    onClick={() => removeItem(item.id)}
                                    color="failure"
                                >
                                    <HiArchive className="text-lg" />
                                </Button>
                            </div>
                        </div>
                    </li>
                )
            })}
        </ul>
    </div>
);