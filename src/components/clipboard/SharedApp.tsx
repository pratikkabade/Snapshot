import { HiOutlineCheck, HiOutlineDocumentDuplicate, HiArchive } from "react-icons/hi";
import { Button } from "flowbite-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClipboardItem {
    id: string;
    content: string;
    created: Date | null;
}

export interface RenderItemsProps {
    clipboardItems: ClipboardItem[];
    itemSelected: string | null;
    copyItem: (item: ClipboardItem) => void;
    removeItem: (id: string) => void;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    renderPasteFromClipboard: () => JSX.Element;
    formatDate: (date: Date) => string;
}

// ─── Shared class strings ─────────────────────────────────────────────────────

export const ITEM_BASE =
    "border border-gray-200 duration-200 shadow-[0_4px_10px_rgba(0,0,0,0.08)] " +
    "hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)] transition-shadow w-full h-fit " +
    "group active:scale-[0.97]";

export const COPY_BTN_SELECTED = "bg-green-200 border-green-400";
export const COPY_BTN_DEFAULT  = "bg-slate-100 border-slate-200 hover:bg-green-100 hover:border-green-300";

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ExpandableContentProps {
    item: ClipboardItem;
    isExpanded: boolean;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    copyItem: (item: ClipboardItem) => void;
    maxChars?: number;
}

export const ExpandableContent = ({
    item,
    isExpanded,
    setExpandedId,
    // copyItem,
    maxChars = 150,
}: ExpandableContentProps) => {
    const isTruncated = item.content.length > maxChars;

    return isExpanded ? (
        <div className="max-h-28 overflow-y-auto pr-2 break-words">
            {item.content}
            <span
                onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                className="block mt-2 text-blue-500 font-medium cursor-pointer hover:underline"
            >
                Show less
            </span>
        </div>
    ) : (
        <>
            {isTruncated ? item.content.slice(0, maxChars) + "…" : item.content}
            {isTruncated && (
                <span
                    onClick={(e) => { e.stopPropagation(); setExpandedId(item.id); }}
                    className="text-blue-500 font-medium ml-1 cursor-pointer hover:underline"
                >
                    Show more
                </span>
            )}
        </>
    );
};

interface ItemActionsProps {
    item: ClipboardItem;
    isSelected: boolean;
    copyItem: (item: ClipboardItem) => void;
    removeItem: (id: string) => void;
    date: string;
    dateClass?: string;
}

export const ItemActions = ({
    item,
    isSelected,
    copyItem,
    removeItem,
    date,
    dateClass = "font-medium text-xs text-gray-500",
}: ItemActionsProps) => (
    <div className="flex justify-between items-center p-2">
        <span className={dateClass}>{date}</span>

        <div className="flex flex-row gap-2">
            <div
                onClick={() => copyItem(item)}
                className={`flex border rounded-full px-2 flex-row items-center text-lg cursor-pointer ${
                    isSelected ? COPY_BTN_SELECTED : COPY_BTN_DEFAULT
                }`}
            >
                {isSelected
                    ? <HiOutlineCheck className="fade-in text-green-700" />
                    : <HiOutlineDocumentDuplicate className="fade-in text-slate-500" />}
            </div>

            <Button size="xs" pill onClick={() => removeItem(item.id)} color="failure">
                <HiArchive className="text-lg" />
            </Button>
        </div>
    </div>
);