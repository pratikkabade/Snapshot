import React, { useEffect, useState } from 'react';
import {
    query, orderBy, onSnapshot, addDoc,
    deleteDoc, doc, collection, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from '../config/Firebase';
import { Alert, Button, Tooltip } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';

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

    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
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
    // const [timeOut, setTimeOut] = useState(true)

    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setTimeOut(false)
    //     }, 3000)
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
        }, 3000);
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
        }, 3000);
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
            <ul className={`fade-in2 rounded-lg overflow-y-auto overflow-x-auto ${message === '' ? 'h-full' : 'h-36'}`}>
                {clipboardItems.map((item) => (
                    <li key={item.id} className="p-3 bg-gray-100 my-2 rounded-xl">
                        <pre onClick={() => copyItem(item)} className={`whitespace-pre-wrap bg-white p-2 rounded-lg text-sm overflow-x-auto overflow-y-auto max-h-60 cursor-pointer border-gray-100 hover:border-gray-600 border-2 ${item.id === itemSelected ? 'bg-green-200 hover:border-green-600 text-gray-600' : ''}`}>
                            {item.content}
                        </pre>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-medium text-sm text-gray-500">
                                {formatDate(item.created)}
                            </span>
                            <div className='flex flex-row gap-2'>
                                {/* Uncomment this to allow copying */}
                                {/* <Button size='xs' onClick={() => copyItem(item)} color='success'>Copy</Button> */}
                                <Button size='xs' pill onClick={() => removeItem(item.id)} color='failure'>X</Button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );

    const renderBigItems = () => (
        <div>
            {renderPasteFromClipboard()}
            <ul className={`fade-in2 rounded-lg overflow-y-auto overflow-x-auto h-full flex flex-row flex-wrap gap-5 justify-center`}>
                {clipboardItems.map((item) => (
                    <li key={item.id} className="p-3 bg-gray-50 border-2 border-gray-200 my-2 rounded-lg w-96 h-fit">
                        <pre onClick={() => copyItem(item)} className={`whitespace-pre-wrap bg-white p-2 rounded-lg text-sm overflow-x-auto overflow-y-auto max-h-60 cursor-pointer border-gray-100 hover:border-gray-600 border-2 ${item.id === itemSelected ? 'bg-green-200 hover:border-green-600 text-gray-600' : ''}`}>
                            {item.content}
                        </pre>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-medium text-sm text-gray-500">
                                {formatDate(item.created)}
                            </span>
                            <div className='flex flex-row gap-2'>
                                {/* Uncomment this to allow copying */}
                                {/* <Button size='xs' onClick={() => copyItem(item)} color='success'>Copy</Button> */}
                                <Button size='xs' pill onClick={() => removeItem(item.id)} color='failure'>X</Button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );

    const renderBigMessage = () => (
        message && <div className="fixed bottom-5 right-5 mt-2 p-2 cursor-default">
            <Alert color={alert}>
                {message}
            </Alert>
        </div>
    );


    const renderEmpty = () => (
        <div className="p-6">
            <div className='bg-white rounded-xl shadow-md text-center scrl h-72'>
                {renderPasteFromClipboard()}
                <p className="text-gray-500">No clipboard items yet. Be the first to paste something!</p>
            </div>
        </div>
    );

    const renderMessage = () => (
        message && <div className="mt-2 p-2">
            <Alert color={alert}>
                {message}
            </Alert>
        </div>
    );

    if (NOTHomePage) return (
        <div className="flex flex-col justify-center items-center">
            <div className={`bg-white rounded-xl shadow-md p-2 w-10/12`}>
                {renderHeader()}
                <div>
                    {loading ? <h3 className="scrl h-72 text-xl text-center font-bold animate-pulse">Loading..</h3> :
                        clipboardItems.length > 0 ? renderBigItems() : renderEmpty()}
                    {renderBigMessage()}
                </div>
            </div>
        </div>
    )


    return (
        <div className="flex flex-col justify-center items-center">
            <div className={`bg-white rounded-xl shadow-md p-2 w-full`}>
                {renderHeader()}
                <div className='scrl h-72'>
                    {loading ? <h3 className="scrl h-72 text-xl text-center font-bold animate-pulse">Loading..</h3> :
                        clipboardItems.length > 0 ? renderItems() : renderEmpty()}
                    {renderMessage()}
                </div>
            </div>
        </div>
    );
};

export default Clipboard;
