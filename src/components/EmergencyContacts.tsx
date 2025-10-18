import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Phone, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface EmergencyContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

function EmergencyContacts() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadContacts();
    }
  }, [user?.id]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      toast.error('Failed to load emergency contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.email || !newContact.relationship) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert([{
          user_id: user?.id,
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
          relationship: newContact.relationship
        }])
        .select()
        .single();

      if (error) throw error;

      setContacts([...contacts, data]);
      setNewContact({ name: '', email: '', phone: '', relationship: '' });
      setIsAdding(false);
      toast.success('Emergency contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add emergency contact');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(contacts.filter(c => c.id !== id));
      toast.success('Emergency contact deleted');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete emergency contact');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl shadow-lg ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Emergency Contacts
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            These contacts will be notified if you express concerning thoughts
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-6 p-4 rounded-xl border-2 border-dashed ${
              theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="John Doe"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Relationship *
                  </label>
                  <select
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select relationship</option>
                    <option value="parent">Parent</option>
                    <option value="spouse">Spouse/Partner</option>
                    <option value="sibling">Sibling</option>
                    <option value="child">Child</option>
                    <option value="friend">Friend</option>
                    <option value="therapist">Therapist</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddContact}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Save Contact
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewContact({ name: '', email: '', phone: '', relationship: '' });
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {contacts.length === 0 ? (
        <div className={`text-center py-8 px-4 rounded-xl ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            No emergency contacts added yet. Add someone who can be reached in case of emergency.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className={`w-4 h-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <h4 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {contact.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      theme === 'dark'
                        ? 'bg-purple-900/50 text-purple-300'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {contact.relationship}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Mail className={`w-3 h-3 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {contact.email}
                      </span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className={`w-3 h-3 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {contact.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className={`mt-6 p-4 rounded-xl ${
        theme === 'dark' ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className={`text-sm font-semibold mb-1 ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
            }`}>
              How Emergency Alerts Work
            </h4>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              If you express concerning thoughts or mention self-harm in the AI assistant, an automatic emergency email will be sent to all your emergency contacts with crisis helpline information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmergencyContacts;
