'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, Building } from 'lucide-react';

import PageBanner from '../../components/PageBanner';
import { Input, Textarea, Select as CustomSelect, Label } from '../../components/ui/Input';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    affiliation: '',
    subject: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [contactSettings, setContactSettings] = useState({
    email: 'editorial@scholarlynest.com',
    phone: '+1 (617) 555-0198',
    address: 'ScholarlyNest Press\n750 University Research Boulevard, Suite 400\nCambridge, MA 02138, United States'
  });

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const res = await api.get('/contact-settings');
        setContactSettings(res.data);
      } catch (err) {
        console.error('Failed to load contact settings:', err);
      }
    };
    fetchContactSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required.';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'A valid email address is required.';
    }
    if (!formData.message.trim()) newErrors.message = 'Please provide details for your inquiry.';

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/contact', formData);
      setSubmitted(true);
      toast('Inquiry submitted successfully.', 'success');
      setFormData({ name: '', email: '', affiliation: '', subject: 'general', message: '' });
      setTimeout(() => {
        setSubmitted(false);
      }, 4000);
    } catch (err) {
      console.error('Submit contact message failed:', err);
      toast(err.response?.data?.message || 'Failed to submit inquiry. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-[var(--background)] min-height-screen transition-premium">
      <title>Contact Us  - ScholarlyNest</title>
      
      <PageBanner 
        title="Connect with our Editorial Board" 
        description="Have questions about manuscript submissions, review status, open-access licensing models, or institutional partnership integrations? Send us an inquiry."
        customLabels={{ contact: 'Contact Us' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* CONTAINER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* A. CONTACT DETAILS (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Coordination details */}
            <div className="bg-white dark:bg-[#121211] p-6 border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg shadow-sm">
              <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-white mb-6">
                Editorial Headquarters
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 text-xs">
                  <MapPin className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">ScholarlyNest Press</p>
                    <p className="text-zinc-555 dark:text-zinc-400 mt-1 whitespace-pre-line">
                      {contactSettings.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
                  <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Editorial Support</p>
                    <p className="text-zinc-555 dark:text-zinc-400">{contactSettings.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
                  <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Communications Office</p>
                    <p className="text-zinc-555 dark:text-zinc-400">{contactSettings.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick helper card */}
            <div className="bg-zinc-100 dark:bg-zinc-900/60 p-6 border border-zinc-200/60 dark:border-zinc-800/40 rounded-lg">
              <div className="flex items-center space-x-2 text-zinc-800 dark:text-zinc-200 mb-3">
                <HelpCircle className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Helpful Resources</h4>
              </div>
              <p className="text-xs text-zinc-555 dark:text-zinc-450 leading-relaxed">
                Before sending an inquiry, researchers are recommended to verify if their question is indexed in our FAQs or manuscript templates guidelines on the platform.
              </p>
            </div>

          </div>

          {/* B. INTERACTIVE CONTACT FORM (7 COLS) */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-[#121211] p-8 border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg shadow-sm">
              <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-white mb-6">
                Send a Message
              </h3>

              {submitted ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-6 rounded-md text-center transition-all">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-450">
                    Inquiry Submitted
                  </h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2 leading-relaxed">
                    Thank you. Your academic inquiry has been registered in our index. Our Editorial Board or system administrators will respond to you within 24-48 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Dr. Jane Smith"
                      error={validationErrors.name}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="jsmith@university.edu"
                        error={validationErrors.email}
                      />
                    </div>

                    <div>
                      <Label>Academic Affiliation</Label>
                      <Input
                        type="text"
                        name="affiliation"
                        value={formData.affiliation}
                        onChange={handleChange}
                        placeholder="e.g. Stanford University"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Subject Matter</Label>
                    <CustomSelect
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="manuscript">Manuscript Submission Question</option>
                      <option value="review">Peer Review Process</option>
                      <option value="partnership">Institutional Partnership</option>
                      <option value="indexing">Abstract Indexing Status</option>
                    </CustomSelect>
                  </div>

                  <div>
                    <Label>Message / Inquiry Details</Label>
                    <Textarea
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please outline the details of your inquiry here..."
                      error={validationErrors.message}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-[var(--accent)] hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-premium mt-6 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
