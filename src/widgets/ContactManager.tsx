import React, { useEffect, useState, useRef } from 'react';
import {
  query, orderBy, onSnapshot, addDoc, where,
  deleteDoc, doc, collection, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db, auth } from '../config/Firebase';
import { Alert, Button, Tooltip, TextInput } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';
import Papa from 'papaparse';

// Types
interface Contact {
  id: string;
  name: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  address?: string;
  Photo?: string;
  notes?: string;
  created: Date | null;
  userId: string;
}

// Utils
const formatDate = (date: Date | null): string =>
  date ? date.toLocaleString() : "Just now";

const ContactManager: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [alert, setAlert] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [timeOut, setTimeOut] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadInProgress, setUploadInProgress] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeOut(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch contacts for current user only
  const currentUser = auth.currentUser;
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      showMessage('Please sign in to view your contacts', 'failure');
      return;
    }

    const contactsRef = collection(db, "contacts");
    const q = query(
      contactsRef,
      where("userId", "==", currentUser.uid),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Contact[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.created as Timestamp;

        return {
          id: doc.id,
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          notes: data.notes || '',
          organization: data.organization || '',
          title: data.title || '',
          Photo: data.Photo || '',
          created: timestamp?.toDate() || null,
          userId: data.userId
        };
      });

      setContacts(items);
      setFilteredContacts(items); // Initially set filtered contacts to all contacts
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setFilteredContacts(contacts); // Reset to all contacts when search is empty
      return;
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();

    const filtered = contacts.filter(contact => {
      const searchableString = [
        contact.name,
        contact.phone,
        contact.email,
        contact.address,
        contact.notes,
        contact.Photo,
      ].join(' ').toLowerCase();

      return searchableString.includes(normalizedQuery);
    });


    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);

  const showMessage = (msg: string, alrt: string) => {
    setMessage(msg);
    setAlert(alrt);
    setTimeout(() => {
      setMessage('');
      setAlert('');
    }, 3000);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'text/csv') {
      showMessage('Please upload a CSV file', 'failure');
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      showMessage('Please sign in to upload contacts', 'failure');
      return;
    }

    showMessage('Processing CSV file...', 'info');
    setUploadInProgress(true);

    interface ParsedContactRow {
      'First Name'?: string;
      'Middle Name'?: string;
      'Last Name'?: string;
      'E-mail 1 - Value'?: string;
      'Phone 1 - Value'?: string;
      'Address 1 - Formatted'?: string;
      'Address 1 - Street'?: string;
      'Address 1 - City'?: string;
      'Address 1 - Region'?: string;
      'Address 1 - Postal Code'?: string;
      'Address 1 - Country'?: string;
      'Notes'?: string;
      'Photo'?: string;
      'Organization Name'?: string;
      'Organization Title'?: string;
    }

    interface PapaParseResult {
      data: ParsedContactRow[];
      errors: unknown[];
      meta: unknown;
    }

    Papa.parse<ParsedContactRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: PapaParseResult) => {
        try {
          const data = results.data;

          let successCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              const firstName = row['First Name'] || '';
              const middleName = row['Middle Name'] || '';
              const lastName = row['Last Name'] || '';
              const email = row['E-mail 1 - Value'] || '';

              let fullName = firstName;
              if (middleName) fullName += ' ' + middleName;
              if (lastName) fullName += ' ' + lastName;

              const phoneValue = row['Phone 1 - Value'] || '';

              if (!fullName.trim() || !phoneValue.trim()) {
                errorCount++;
                continue;
              }

              let address = '';
              if (row['Address 1 - Formatted']) {
                address = row['Address 1 - Formatted'];
              } else {
                const addressParts = [
                  row['Address 1 - Street'],
                  row['Address 1 - City'],
                  row['Address 1 - Region'],
                  row['Address 1 - Postal Code'],
                  row['Address 1 - Country']
                ].filter(Boolean);
                if (addressParts.length > 0) {
                  address = addressParts.join(', ');
                }
              }

              const notes = row['Notes'] || '';
              const photoUrl = row['Photo'] || '';
              const organization = row['Organization Name'] || '';
              const title = row['Organization Title'] || '';

              const contactData = {
                name: fullName.trim(),
                phone: phoneValue.trim(),
                email: email.trim(),
                organization: organization.trim(),
                title: title.trim(),
                address: address.trim(),
                notes: notes.trim(),
                Photo: photoUrl.trim(),
                created: serverTimestamp(),
                userId: currentUser.uid
              };

              await addDoc(collection(db, "contacts"), contactData);

              successCount++;
            } catch (err) {
              console.error("Error adding contact:", err, "Row data:", row);
              errorCount++;
            }
          }

          if (successCount > 0) {
            showMessage(`Successfully added ${successCount} contacts. Failed: ${errorCount}`, 'success');
          } else {
            showMessage(`Failed to add contacts. Please check your CSV format.`, 'failure');
          }

          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (err) {
          console.error("CSV processing error:", err);
          showMessage(`Failed to upload contacts: ${err instanceof Error ? err.message : String(err)}`, 'failure');
        } finally {
          setUploadInProgress(false);
        }
      },
      error: (error: Error) => {
        console.error("Papa parse error:", error);
        showMessage(`Error parsing CSV: ${error.message}`, 'failure');
        setUploadInProgress(false);
      }
    });
  };

  const removeContact = async (id: string) => {
    try {
      await deleteDoc(doc(db, "contacts", id));
      showMessage('Contact removed', 'warning');
    } catch (err) {
      showMessage(`Failed to remove: ${err instanceof Error ? err.message : String(err)}`, 'failure');
    }
  };

  const copyContactInfo = (contact: Contact) => {
    let contactInfo = `Name: ${contact.name}\nPhone: ${contact.phone}`;

    if (contact.email) contactInfo += `\nEmail: ${contact.email}`;
    if (contact.address) contactInfo += `\nAddress: ${contact.address}`;
    if (contact.notes) contactInfo += `\nNotes: ${contact.notes}`;
    if (contact.Photo) contactInfo += `\nPhoto: ${contact.Photo}`;

    navigator.clipboard.writeText(contactInfo)
      .then(() => showMessage('Contact info copied to clipboard!', 'success'))
      .catch(err => showMessage(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'failure'));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const renderUploadButton = () => (
    <div className='flex justify-center mt-1 mb-4'>
      <Tooltip content='Upload Google Contacts CSV'>
        <Button pill outline color={'blue'} onClick={handleUploadClick} disabled={uploadInProgress}>
          {uploadInProgress ? 'Processing...' : 'Upload Contacts CSV'}
        </Button>
      </Tooltip>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileUpload}
        disabled={uploadInProgress}
      />
    </div>
  );

  const renderSearchBar = () => (
    <div className="mb-4">
      <TextInput
        placeholder="Search contacts by name or phone"
        value={searchQuery}
        onChange={handleSearch}
        icon={() => <i className="fa-solid fa-search text-gray-400"></i>}
      />
    </div>
  );

  const location = useLocation();
  const NOTHomePage = !["/"].includes(location.pathname);

  const renderHeader = () => (
    <div className="flex flex-row justify-center text-2xl text-slate-700 font-semibold text-center mt-2 mb-5">
      {NOTHomePage ?
        <></>
        :
        <Link to={'/Contacts'} className="p-2 px-4 rounded-full border-2 border-white hover:border-slate-300">
          <i className='fa-solid fa-address-book mr-3'></i>
          Contacts ({contacts.length})
        </Link>
      }
    </div>
  );

  useEffect(() => {
    if (NOTHomePage) {
      document.title = `Contacts (${contacts.length})`;
    }
  }, [contacts.length, NOTHomePage]);

  const renderContactsList = () => {
    if (filteredContacts.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          <p>No contacts found matching "{searchQuery}"</p>
        </div>
      );
    }

    if (searchQuery === '') {
      return (
        <div className="p-4 text-center text-gray-500">
          <p>Search through all contacts</p>
        </div>
      );
    }

    return (
      <ul className="fade-in2">
        {filteredContacts.map((contact) => (
          <li key={contact.id} className="p-3 border-2 border-gray-100 shadow-md my-2 rounded-xl">
            <div className="p-2 rounded text-sm overflow-x-auto overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <img
                    src={contact.Photo === '' ? 'https://www.shutterstock.com/image-vector/people-person-icon-modern-flat-600nw-1691909635.jpg' : contact.Photo}
                    alt="Contact" className="w-16 h-16 rounded-full mb-2" />
                </div>
                <div className="col-span-3 gap-3 overflow-x-auto overflow-y-auto">
                  <div className='flex flex-col items-start mb-3'>
                    <div className='text-lg'>{contact.name}</div>
                    <div className="text-sm text-gray-500">{contact.organization} - {contact.title}</div>
                  </div>
                </div>
              </div>

              <div className='flex flex-row items-center mb-3'>
                <a
                  href={`tel:${contact.phone}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <i className="fa-solid fa-phone p-2 rounded-full bg-emerald-500 text-white hover:brightness-110"></i>
                </a>
                <div className='ml-3 justify-start overflow-x-auto overflow-y-auto'>
                  {contact.phone}
                </div>
              </div>

              {contact.email &&
                <div className='flex flex-row items-center mb-3'>
                  <a
                    href={`mailto:${contact.email}`}
                    target="_blank"
                    rel="noopener noreferrer">
                    <i className="fa-solid fa-envelope p-2 rounded-full bg-rose-500 text-white hover:brightness-110"></i>
                  </a>
                  <div className='ml-3 justify-start overflow-x-auto overflow-y-auto'>
                    {contact.email}
                  </div>
                </div>}

              {contact.address &&
                <div className='flex flex-row items-center mb-3'>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                    target="_blank"
                    rel="noopener noreferrer">
                    <i className="fa-solid fa-location-dot p-2 rounded-full bg-blue-500 text-white hover:brightness-110"></i>
                  </a>
                  <div className='ml-3 justify-start overflow-x-auto overflow-y-auto'>
                    {contact.address}
                  </div>
                </div>}

              {contact.notes &&
                <div className='mb-3'>
                  <i className="fa-solid fa-address-card p-2 rounded-full bg-gray-500 text-white hover:brightness-110"></i>
                  <span className='ml-3'>
                    {contact.notes}
                  </span>
                </div>}
            </div>

            <div className="flex justify-between items-center">
              <Button size='xs' onClick={() => copyContactInfo(contact)} color='success'>Copy</Button>
              <Button size='xs' pill onClick={() => removeContact(contact.id)} color='failure'>X</Button>
            </div>
            <div className="text-xs text-gray-500">Added: {formatDate(contact.created)}</div>
          </li>
        ))
        }
      </ul >
    );
  };

  const renderContacts = () => (
    <div className={`overflow-y-auto overflow-x-auto ${message === '' ? 'h-full' : NOTHomePage ? 'h-96' : 'h-52'}`}>
      {renderUploadButton()}
      {renderSearchBar()}
      {renderContactsList()}
    </div>
  );

  const renderEmpty = () => (
    <div className="">
      {/* <div className='bg-white rounded-xl shadow-md text-center scrl h-72'> */}
      {renderUploadButton()}
      {/* {renderSearchBar()} */}
      <div className='p-4 text-center text-gray-500'>
        <p>No contacts yet.</p>
        <p>Upload a Google Contacts CSV to get started.</p>
      </div>
      {/* </div> */}
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
              (contacts.length > 0 ? renderContacts() : renderEmpty()) :
              <div className="p-6 text-center">Please sign in to view your contacts</div>
          }
          {renderMessage()}
        </div>
      </div>
    </div>
  );
};

export default ContactManager;