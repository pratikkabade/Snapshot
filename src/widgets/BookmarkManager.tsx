import React, { useEffect, useState, useRef } from 'react';
import {
    query, orderBy, onSnapshot, addDoc, where,
    deleteDoc, doc, collection, serverTimestamp, Timestamp, getDocs
} from "firebase/firestore";
import { db, auth } from '../config/Firebase';
import { Alert, Button, Tooltip, TextInput } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';

// Types
interface Bookmark {
    id: string;
    title: string;
    url: string;
    category: string;
    description?: string;
    favicon?: string;
    created: Date | null;
    userId: string;
}

// Utils
const formatDate = (date: Date | null): string =>
    date ? date.toLocaleString() : "Just now";

const isValidURL = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

const BookmarkManager: React.FC = () => {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [alert, setAlert] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [timeOut, setTimeOut] = useState(true);

    // Form states
    const [newBookmarkUrl, setNewBookmarkUrl] = useState<string>('');
    const [newBookmarkTitle, setNewBookmarkTitle] = useState<string>('');
    const [newBookmarkCategory, setNewBookmarkCategory] = useState<string>('');
    const [newBookmarkDescription, setNewBookmarkDescription] = useState<string>('');
    const [showAddForm, setShowAddForm] = useState<boolean>(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeOut(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Fetch bookmarks for current user only
    const currentUser = auth.currentUser;
    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            showMessage('Please sign in to view your bookmarks', 'failure');
            return;
        }

        const bookmarksRef = collection(db, "bookmarks");
        const q = query(
            bookmarksRef,
            where("userId", "==", currentUser.uid),
            orderBy('created', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Bookmark[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                const timestamp = data.created as Timestamp;

                return {
                    id: doc.id,
                    title: data.title || '',
                    url: data.url || '',
                    category: data.category || '',
                    description: data.description || '',
                    favicon: data.favicon || '',
                    created: timestamp?.toDate() || null,
                    userId: data.userId
                };
            });

            setBookmarks(items);
            setFilteredBookmarks(items); // Initially set filtered bookmarks to all bookmarks
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Search functionality
    useEffect(() => {
        if (!searchQuery || searchQuery.trim() === '') {
            setFilteredBookmarks(bookmarks); // Reset to all bookmarks when search is empty
            return;
        }

        const normalizedQuery = searchQuery.toLowerCase().trim();

        const filtered = bookmarks.filter(bookmark => {
            const searchableString = [
                bookmark.title,
                bookmark.url,
                bookmark.category,
                bookmark.description,
            ].join(' ').toLowerCase();

            return searchableString.includes(normalizedQuery);
        });

        setFilteredBookmarks(filtered);
    }, [searchQuery, bookmarks]);

    const showMessage = (msg: string, alrt: string) => {
        setMessage(msg);
        setAlert(alrt);
        setTimeout(() => {
            setMessage('');
            setAlert('');
        }, 3000);
    };

    const addBookmark = async () => {
        if (!newBookmarkUrl.trim()) {
            showMessage('URL is required', 'failure');
            return;
        }

        if (!isValidURL(newBookmarkUrl)) {
            showMessage('Please enter a valid URL', 'failure');
            return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
            showMessage('Please sign in to add bookmarks', 'failure');
            return;
        }

        try {
            // Create bookmark with favicon
            let urlObject: URL;
            try {
                // Add https:// prefix if missing
                if (!newBookmarkUrl.match(/^https?:\/\//i)) {
                    urlObject = new URL(`https://${newBookmarkUrl}`);
                } else {
                    urlObject = new URL(newBookmarkUrl);
                }
            } catch (e) {
                showMessage('Invalid URL format', 'failure');
                return;
            }

            // Generate favicon URL from the domain
            const favicon = `https://www.google.com/s2/favicons?domain=${urlObject.hostname}&sz=128`;

            // Use provided title or extract domain name if title is empty
            const title = newBookmarkTitle.trim() || urlObject.hostname.replace(/^www\./, '');

            const bookmarkData = {
                title: title,
                url: urlObject.href, // Use normalized URL
                category: newBookmarkCategory.trim(),
                description: newBookmarkDescription.trim(),
                favicon: favicon,
                created: serverTimestamp(),
                userId: currentUser.uid
            };

            await addDoc(collection(db, "bookmarks"), bookmarkData);

            // Reset form
            setNewBookmarkUrl('');
            setNewBookmarkTitle('');
            setNewBookmarkCategory('');
            setNewBookmarkDescription('');
            setShowAddForm(false);

            showMessage('Bookmark added successfully', 'success');
        } catch (err) {
            showMessage(`Failed to add bookmark: ${err instanceof Error ? err.message : String(err)}`, 'failure');
        }
    };

    const removeBookmark = async (id: string) => {
        try {
            await deleteDoc(doc(db, "bookmarks", id));
            showMessage('Bookmark removed', 'warning');
        } catch (err) {
            showMessage(`Failed to remove: ${err instanceof Error ? err.message : String(err)}`, 'failure');
        }
    };

    const copyBookmarkInfo = (bookmark: Bookmark) => {
        let bookmarkInfo = bookmark.url;

        navigator.clipboard.writeText(bookmarkInfo)
            .then(() => showMessage('Bookmark info copied to clipboard!', 'success'))
            .catch(err => showMessage(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'failure'));
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
    };

    const renderAddBookmarkForm = () => (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Add New Bookmark</h3>
            <div className="space-y-3">
                <div className='flex flex-row items-center gap-2'>
                    <TextInput
                        placeholder="URL (required)"
                        value={newBookmarkUrl}
                        onChange={(e) => setNewBookmarkUrl(e.target.value)}
                        className='w-full'
                    />
                    <Button
                        color="gray"
                        onClick={() => {
                            // paste the URL from clipboard
                            navigator.clipboard.readText().then(text => {
                                setNewBookmarkUrl(text);
                            }).catch(err => {
                                showMessage(`Failed to paste: ${err instanceof Error ? err.message : String(err)}`, 'failure');
                            });
                        }}
                    >
                        <i className="fa-solid fa-paste"></i>
                    </Button>
                </div>
                <TextInput
                    placeholder="Title (optional - will use domain if empty)"
                    value={newBookmarkTitle}
                    onChange={(e) => setNewBookmarkTitle(e.target.value)}
                />
                <TextInput
                    placeholder="Category (optional)"
                    value={newBookmarkCategory}
                    onChange={(e) => setNewBookmarkCategory(e.target.value)}
                />
                <TextInput
                    placeholder="Description (optional)"
                    value={newBookmarkDescription}
                    onChange={(e) => setNewBookmarkDescription(e.target.value)}
                />
                <div className="flex space-x-2">
                    <Button color="blue" onClick={addBookmark}>Save Bookmark</Button>
                    <Button color="gray" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
            </div>
        </div>
    );

    const renderAddButton = () => (
        <div className='flex justify-center mt-1 mb-4'>
            <Button pill outline color="blue" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Cancel' : 'Add New Bookmark'}
            </Button>
        </div>
    );

    const renderSearchBar = () => (
        <div className="mb-4 flex flex-row items-center justify-between gap-2">
            <TextInput
                placeholder="Search bookmarks by title, URL or category"
                value={searchQuery}
                onChange={handleSearch}
                className="w-full"
                icon={() => <i className="fa-solid fa-search text-gray-400"></i>}
            />
            {searchQuery !== '' && <Button
                color="gray"
                onClick={() => {
                    setSearchQuery('');
                }}
            >
                <i className="fa-solid fa-xmark"></i>
            </Button>}
        </div>
    );

    const location = useLocation();
    const NOTHomePage = !["/"].includes(location.pathname);

    const renderHeader = () => (
        <div className="flex flex-row justify-center text-2xl text-slate-700 font-semibold text-center mt-2 mb-5">
            {NOTHomePage ?
                <></>
                :
                <Link to={'/Bookmarks'} className="p-2 px-4 rounded-full border-2 border-white hover:border-slate-300">
                    <i className='fa-solid fa-bookmark mr-3'></i>
                    Bookmarks ({bookmarks.length})
                </Link>
            }
        </div>
    );

    useEffect(() => {
        if (NOTHomePage) {
            document.title = `Bookmarks (${bookmarks.length})`;
        }
    }, [bookmarks.length, NOTHomePage]);

    const renderBookmarksList = () => {
        if (filteredBookmarks.length === 0) {
            return (
                <div className="p-4 text-center text-gray-500">
                    <p>No bookmarks found matching "{searchQuery}"</p>
                </div>
            );
        }

        return (
            <ul className="fade-in2">
                {filteredBookmarks.map((bookmark) => (
                    <li key={bookmark.id} className="p-3 border-2 border-gray-100 shadow-md my-2 rounded-xl">
                        <div className="p-2 rounded text-sm overflow-x-auto overflow-y-auto">
                            <div className="flex flex-row justify-between items-center mb-2">
                                <div className='flex flex-row items-center'>
                                    <img
                                        src={bookmark.favicon || 'https://www.google.com/s2/favicons?domain=example.com&sz=128'}
                                        alt="Favicon"
                                        className="w-8 h-8 mr-3"
                                    />
                                    <div>
                                        <a
                                            href={bookmark.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline hover:text-blue-800"
                                        >
                                            <div className="text-lg font-medium">{bookmark.title}</div>
                                        </a>
                                        <div className='flex flex-row gap-2 items-center'>
                                            {bookmark.category && (
                                                <div
                                                    onClick={() => setSearchQuery(bookmark.category)}
                                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block cursor-pointer hover:bg-blue-200">
                                                    {bookmark.category}
                                                </div>
                                            )}
                                            {bookmark.description && (
                                                <div className="text-gray-600">
                                                    {bookmark.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row">
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => copyBookmarkInfo(bookmark)}
                                            size="xs" color="blue">
                                            Copy
                                        </Button>
                                        <Button size="xs" pill onClick={() => removeBookmark(bookmark.id)} color="failure">
                                            X
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 mt-1">Saved: {formatDate(bookmark.created)}</div>
                    </li>
                ))}
            </ul>
        );
    };

    const renderBookmarks = () => (
        <div className={`overflow-y-auto overflow-x-auto ${message === '' ? 'h-full' : NOTHomePage ? 'h-96' : 'h-52'}`}>
            {renderAddButton()}
            {showAddForm && renderAddBookmarkForm()}
            {renderSearchBar()}
            {renderBookmarksList()}
        </div>
    );

    const renderEmpty = () => (
        <div>
            {renderAddButton()}
            {showAddForm && renderAddBookmarkForm()}
            <div className="p-4 text-center text-gray-500">
                <p>No bookmarks yet.</p>
                <p>Add your first bookmark to get started.</p>
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

    return (
        <div className="flex flex-col justify-center items-center">
            <div className={`bg-white rounded-xl shadow-md p-2 ${NOTHomePage ? 'w-5/6' : 'w-full'}`}>
                {renderHeader()}
                <div className={`${NOTHomePage ? '' : 'scrl h-72'}`}>
                    {loading || timeOut ? <h3 className="scrl h-72 text-xl text-center font-bold animate-pulse">Loading..</h3> :
                        auth.currentUser ?
                            (bookmarks.length > 0 ? renderBookmarks() : renderEmpty()) :
                            <div className="p-6 text-center">Please sign in to view your bookmarks</div>
                    }
                    {renderMessage()}
                </div>
            </div>
        </div>
    );
};

export default BookmarkManager;