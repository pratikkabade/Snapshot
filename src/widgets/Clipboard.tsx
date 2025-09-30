import React, { useEffect, useState } from 'react';
import {
    query, orderBy, onSnapshot, addDoc,
    deleteDoc, doc, collection, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from '../config/Firebase';
import { Alert, Button } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';
import { HiArchive, HiOutlineDocumentDuplicate, HiOutlineCheck } from 'react-icons/hi';

// Types
interface ClipboardItem {
    id: string;
    content: string;
    created: Date | null;
}

// Utils
const formatDate = (date: Date | null): string => {
    if (!date) return "Just now";

    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) return `Just now`;
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
};

// Firebase reference
const clipboardCollectionRef = collection(db, "publicClipboard");

const Clipboard: React.FC = () => {
    const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
    const [message, setMessage] = useState<string>('');
    const [alert, setAlert] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [itemSelected, setItemSelected] = useState<string>('');
    const [expandedId, setExpandedId] = React.useState<string | null>(null);
    // const [timeOut, setTimeOut] = useState(true)

    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setTimeOut(false)
    //     }, 5000)
    //     return () => clearTimeout(timer)
    // })


    // Fetch clipboard items
    useEffect(() => {
        const q = query(clipboardCollectionRef, orderBy('created', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: ClipboardItem[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                const timestamp = data.created as Timestamp;

                return {
                    id: doc.id,
                    content: data.content,
                    created: timestamp?.toDate() || null
                };
            });

            setClipboardItems(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const showMessage = (msg: string, alrt: string) => {
        setMessage(msg);
        setAlert(alrt);
        setTimeout(() => {
            setMessage('');
            setAlert('');
        }, 5000);
    };

    const pasteFromClipboard = async () => {
        try {
            showMessage('Content pasted and saved!', 'success');
            const text = await navigator.clipboard.readText();
            if (!text.trim()) return showMessage('Clipboard is empty!', 'failure');

            await addDoc(clipboardCollectionRef, {
                content: text,
                created: serverTimestamp()
            });
        } catch (err) {
            showMessage(`Failed to read clipboard: ${err instanceof Error ? err.message : String(err)}`, 'failure');
        }
    };

    const copyItem = (item: ClipboardItem) => {
        setItemSelected(item.id);
        navigator.clipboard.writeText(item.content)
            .then(() => showMessage('Copied to clipboard!', 'success'))
            .catch(err => showMessage(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'failure'));
        setTimeout(() => {
            setItemSelected('');
        }, 5000);
    };

    const removeItem = async (id: string) => {
        try {
            showMessage('Item removed', 'warning');
            await deleteDoc(doc(db, "publicClipboard", id));
        } catch (err) {
            showMessage(`Failed to remove: ${err instanceof Error ? err.message : String(err)}`, 'failure');
        }
    };

    const renderPasteFromClipboard = () => (
        <div className='flex justify-center mt-1 mb-4'>
            <Button pill outline color={'blue'} onClick={pasteFromClipboard}>
                Paste from Clipboard
            </Button>
        </div>
    )

    const location = useLocation();
    const NOTHomePage = !["/"].includes(location.pathname);
    const renderHeader = () => (
        <div className="flex flex-row justify-center text-2xl text-slate-700 font-semibold text-center mt-2 mb-5">
            {NOTHomePage ?
                <></>
                :
                <Link to={'/Clipboard'} className="p-2 px-4 rounded-full border-2 border-white hover:border-slate-300">
                    <i className='fa-solid fa-clipboard mr-3'></i>
                    Clipboard ({clipboardItems.length})
                </Link>
            }
            {renderMessage()}
        </div>
    );

    useEffect(() => {
        if (NOTHomePage) {
            document.title = `Clipboard (${clipboardItems.length})`
        }
    }, [clipboardItems.length, NOTHomePage])


    const renderItems = () => (
        <div>
            {renderPasteFromClipboard()}
            <ul className={`fade-in2 rounded-lg overflow-y-auto overflow-x-auto h-full`}>
                {clipboardItems.map((item) => {
                    const isSelected = item.id === itemSelected;
                    const isExpanded = expandedId === item.id;
                    return (
                        <li key={item.id} className={`p-3 bg-gray-50 dark:bg-gray-700 my-2 rounded-xl bg-white/80 backdrop-blur-md text- border border-gray-200 dark:border-gray-600 duration-200 hover:shadow-md transition-shadow max-w-96 w-full h-fit group ${isSelected
                            ? "bg-green-100 dark:bg-green-800 border-green-400 dark:border-green-600 hover:border-green-500 text-green-600 dark:text-green-200"
                            : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white"
                            }`}>
                            <div onClick={() => copyItem(item)} className={`whitespace-pre-wrap break-words p-1 rounded-xl text-sm hover:text-green-800 dark:hover:text-green-100 cursor-pointer`}>
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
                                    {formatDate(item.created)}
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

    const renderBigItems = () => (
        <div>
            {renderPasteFromClipboard()}

            <ul className={`fade-in2 rounded-3xl h-full flex flex-row flex-wrap gap-6 p-4`}
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", }}>
                {clipboardItems.map((item) => {
                    const isSelected = item.id === itemSelected;
                    const isExpanded = expandedId === item.id;

                    return (
                        <li key={item.id}
                            className={`p-4 bg-white dark:bg-gray-700 backdrop-blur-md border border-gray-200 dark:border-gray-600 duration-200 hover:shadow-lg transition-shadow my-2 rounded-2xl max-w-96 w-full h-fit group ${isSelected
                                ? "bg-green-100 dark:bg-green-800 border-green-400 dark:border-green-600 hover:border-green-500 text-green-600 dark:text-green-200"
                                : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white"
                                }`}>
                            <div onClick={() => copyItem(item)} className={`whitespace-pre-wrap break-words p-1 rounded-xl text-sm hover:text-green-800 dark:hover:text-green-100 cursor-pointer`}>
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

                            <div className="flex justify-between items-center mt-3">
                                <span className="font-medium text-xs text-gray-500">
                                    {formatDate(item.created)}
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
                    );
                })}
            </ul>
        </div>
    );

    const renderBigMessage = () => (
        message && <div className="fade-in fixed bottom-5 right-5 cursor-default">
            <Alert color={alert}>
                {message}
            </Alert>
        </div>
    );


    const renderEmpty = () => (
        <div className="p-6">
            <div className='text-center h-72'>
                {renderPasteFromClipboard()}
                <p className="text-gray-500">No clipboard items yet. Be the first to paste something!</p>
            </div>
        </div>
    );

    const renderMessage = () => (
        message && !NOTHomePage && <div className="fade-in cursor-default">
            <Alert color={alert}>
                {message}
            </Alert>
        </div>
    );

    if (NOTHomePage) return (
        <div className="flex flex-col justify-center items-center">
            <div className={`p-2 w-11/12 dark:bg-gray-900`}>
                {renderHeader()}
                <div>
                    {loading ? <h3 className="text-xl text-center font-bold animate-pulse">Loading..</h3> :
                        clipboardItems.length > 0 ? renderBigItems() : renderEmpty()}
                    {renderBigMessage()}
                </div>
            </div>
        </div>
    )


    return (
        <div className="flex flex-col justify-center items-center">
            <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-md p-2 w-full`}>
                {renderHeader()}
                <div className='scrl h-72'>
                    {loading ? <h3 className="scrl h-72 text-xl text-center font-bold animate-pulse">Loading..</h3> :
                        clipboardItems.length > 0 ? renderItems() : renderEmpty()}
                </div>
            </div>
        </div>
    );
};

export default Clipboard;
