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
const formatDate = (date: Date | null): string =>
  date ? date.toLocaleString() : "Just now";

// Firebase reference
const clipboardCollectionRef = collection(db, "publicClipboard");

const Clipboard: React.FC = () => {
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [message, setMessage] = useState<string>('');
  const [alert, setAlert] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [timeOut, setTimeOut] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeOut(false)
    }, 3000)
    return () => clearTimeout(timer)
  })


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
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return showMessage('Clipboard is empty!', 'failure');

      await addDoc(clipboardCollectionRef, {
        content: text,
        created: serverTimestamp()
      });

      showMessage('Content pasted and saved!', 'success');
    } catch (err) {
      showMessage(`Failed to read clipboard: ${err instanceof Error ? err.message : String(err)}`, 'failure');
    }
  };

  const copyItem = (item: ClipboardItem) => {
    navigator.clipboard.writeText(item.content)
      .then(() => showMessage('Copied to clipboard!', 'success'))
      .catch(err => showMessage(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'failure'));
  };

  const removeItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "publicClipboard", id));
      showMessage('Item removed', 'warning');
    } catch (err) {
      showMessage(`Failed to remove: ${err instanceof Error ? err.message : String(err)}`, 'failure');
    }
  };

  const renderPasteFromClipboard = () => (
    <div className='flex justify-center mt-1 mb-4'>
      <Tooltip content='All these items are public.'>
        <Button pill outline color={'blue'} onClick={pasteFromClipboard}>
          Paste from Clipboard
        </Button>
      </Tooltip>
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
    <ul className={`fade-in2 rounded-lg overflow-y-auto overflow-x-auto ${message === '' ? 'h-full' : NOTHomePage ? 'h-96' : 'h-52'}`}>
      {renderPasteFromClipboard()}
      {clipboardItems.map((item) => (
        <li key={item.id} className="p-3 bg-gray-100 my-2 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm text-gray-500">
              {formatDate(item.created)}
            </span>
            <div className='flex flex-row gap-2'>
              {/* Uncomment this to allow copying */}
              {/* <Button size='xs' onClick={() => copyItem(item)} color='success'>Copy</Button> */}
              <Button size='xs' pill onClick={() => removeItem(item.id)} color='failure'>X</Button>
            </div>
          </div>
          <div className="bg-white p-2 rounded text-sm overflow-x-auto max-h-32 overflow-y-auto">
            <pre onClick={() => copyItem(item)} className="whitespace-pre-wrap select-all">
              {item.content}
            </pre>
          </div>
        </li>
      ))}
    </ul>
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

  return (
    <div className="flex flex-col justify-center items-center">
      <div className={`bg-white rounded-xl shadow-md p-2 ${NOTHomePage ? 'w-5/6' : 'w-full'}`}>
        {renderHeader()}
        <div className={`${NOTHomePage ? '' : 'scrl h-72'}`}>
          {loading || timeOut ? <h3 className="scrl h-72 text-xl text-center font-bold animate-pulse">Loading..</h3> :
            clipboardItems.length > 0 ? renderItems() : renderEmpty()}
          {renderMessage()}
        </div>
      </div>
    </div>
  );
};

export default Clipboard;
