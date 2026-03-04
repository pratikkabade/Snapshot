import { RenderItemsProps, ITEM_BASE, ExpandableContent, ItemActions } from "./SharedApp";

export const renderItems = ({
    clipboardItems,
    itemSelected,
    copyItem,
    removeItem,
    expandedId,
    setExpandedId,
    renderPasteFromClipboard,
    formatDate,
}: RenderItemsProps) => (
    <div>
        {renderPasteFromClipboard()}

        <ul className="fade-in2 rounded-lg h-full pr-5 pl-2">
            {clipboardItems.map((item) => {
                const isSelected = item.id === itemSelected;
                const isExpanded = expandedId === item.id;

                return (
                    <li
                        key={item.id}
                        className={`${ITEM_BASE} bg-white/80 backdrop-blur-md rounded-xl max-w-96 my-2 border-gray-200 text-gray-700`}
                    >
                        {/* Clickable content area */}
                        <div
                            onClick={() => copyItem(item)}
                            className={`whitespace-pre-wrap break-words p-2 rounded-xl text-sm cursor-pointer border
                                ${isSelected
                                    ? "bg-green-100 border-green-400"
                                    : "bg-green-50 border-green-50 hover:border-green-400"
                                }`}
                        >
                            <ExpandableContent
                                item={item}
                                isExpanded={isExpanded}
                                expandedId={expandedId}
                                setExpandedId={setExpandedId}
                                copyItem={copyItem}
                            />
                        </div>

                        <ItemActions
                            item={item}
                            isSelected={isSelected}
                            copyItem={copyItem}
                            removeItem={removeItem}
                            date={formatDate(item.created!)}
                            dateClass="font-medium text-sm text-gray-500"
                        />
                    </li>
                );
            })}
        </ul>
    </div>
);