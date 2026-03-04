import { RenderItemsProps, ITEM_BASE, ExpandableContent, ItemActions } from "./SharedApp";

export const renderBigItems = ({
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

        <ul
            className="fade-in2 rounded-3xl h-full flex flex-row flex-wrap gap-6 p-4"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}
        >
            {clipboardItems.map((item) => {
                const isSelected = item.id === itemSelected;
                const isExpanded = expandedId === item.id;

                return (
                    <li
                        key={item.id}
                        className={`${ITEM_BASE} bg-white backdrop-blur-md rounded-2xl max-w-96 my-2 text-gray-700 border`}
                    >
                        {/* Clickable content area */}
                        <div
                            onClick={() => copyItem(item)}
                            className={`whitespace-pre-wrap break-words p-4 rounded-2xl text-sm cursor-pointer border
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
                            dateClass="font-medium text-xs text-gray-500 pl-3"
                        />
                    </li>
                );
            })}
        </ul>
    </div>
);