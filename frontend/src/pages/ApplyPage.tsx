import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, ArrowRight, Upload, X, CheckCircle2,
  User, Store, Bike, AlertCircle, Camera,
} from 'lucide-react';
import { applicationsService, type ApplicationSubmitBody } from '@/services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVINCES = ['Kigali City', 'Eastern Province', 'Northern Province', 'Southern Province', 'Western Province'];

const VEHICLE_TYPES = ['Motorcycle', 'Bicycle', 'Car', 'Van', 'Truck', 'On Foot'];

const BUSINESS_TYPES = [
  'Retail', 'Wholesale', 'Food & Beverage', 'Electronics', 'Clothing & Fashion',
  'Health & Beauty', 'Home & Garden', 'Sports & Outdoors', 'Books & Stationery',
  'Handicrafts & Art', 'Agriculture', 'Services', 'Other',
];

// ─── Shared input class ───────────────────────────────────────────────────────

const inp = 'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 bg-white';
const sel = `${inp} appearance-none`;

// ─── Section wrapper ─────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold uppercase tracking-widest text-orange-500">{title}</h3>
    {children}
  </div>
);

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-slate-700">
      {label}{required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
  </div>
);

// ─── Grid 2 ──────────────────────────────────────────────────────────────────

const Grid2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
);

// ─── Photo upload component ───────────────────────────────────────────────────

interface PhotoUploadProps {
  photoUrl: string;
  uploading: boolean;
  onChange: (file: File) => void;
  onClear: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ photoUrl, uploading, onChange, onClear }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {photoUrl ? (
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-orange-400 shadow-md">
            <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={onClear}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-500 disabled:cursor-wait disabled:opacity-60"
          >
            {uploading ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400/30 border-t-orange-500" />
            ) : (
              <>
                <Camera className="h-6 w-6" />
                <span className="text-[10px] font-medium">Upload Photo</span>
              </>
            )}
          </button>
        )}
      </div>
      {!photoUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-orange-300 transition disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" /> Choose image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = ''; }}
      />
      <p className="text-[11px] text-slate-400 text-center">JPG, PNG or WebP · Max 5 MB</p>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

type RoleType = 'VENDOR' | 'RIDER';

interface FormState {
  // Personal
  fullName: string; email: string; phone: string;
  nationalId: string; dateOfBirth: string;
  address: string; district: string; province: string;
  photoUrl: string;
  // Vendor
  businessName: string; businessType: string; businessAddress: string;
  momoNumber: string; yearsInBusiness: string; description: string;
  // Rider
  vehicleType: string; plateNumber: string; licenseNumber: string;
  deliveryZone: string; experience: string;
  // Emergency
  emergencyName: string; emergencyPhone: string;
}

const INITIAL: FormState = {
  fullName: '', email: '', phone: '', nationalId: '', dateOfBirth: '',
  address: '', district: '', province: '',
  photoUrl: '',
  businessName: '', businessType: '', businessAddress: '',
  momoNumber: '', yearsInBusiness: '', description: '',
  vehicleType: '', plateNumber: '', licenseNumber: '',
  deliveryZone: '', experience: '',
  emergencyName: '', emergencyPhone: '',
};

const ApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<RoleType | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Photo upload ──────────────────────────────────────────────────────────
  const handlePhotoChange = async (file: File) => {
    setUploading(true);
    try {
      const url = await applicationsService.uploadPhoto(file);
      setForm(f => ({ ...f, photoUrl: url }));
    } catch (e) {
      setError((e as Error).message || 'Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true); setError('');

    const body: ApplicationSubmitBody = {
      role,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      nationalId: form.nationalId,
      dateOfBirth: form.dateOfBirth,
      address: form.address,
      district: form.district,
      province: form.province,
      photoUrl: form.photoUrl || undefined,
      emergencyName: form.emergencyName,
      emergencyPhone: form.emergencyPhone,
      ...(role === 'VENDOR' ? {
        businessName: form.businessName,
        businessType: form.businessType,
        businessAddress: form.businessAddress,
        momoNumber: form.momoNumber,
        yearsInBusiness: form.yearsInBusiness ? Number(form.yearsInBusiness) : undefined,
        description: form.description || undefined,
      } : {
        vehicleType: form.vehicleType,
        plateNumber: form.plateNumber,
        licenseNumber: form.licenseNumber,
        deliveryZone: form.deliveryZone,
        experience: form.experience || undefined,
      }),
    };

    try {
      await applicationsService.submit(body);
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Application Submitted!</h1>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Your application as a <strong>{role === 'VENDOR' ? 'Vendor' : 'Rider'}</strong> has been received.
            Our team will review it and send you an email with your account details once approved.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Review typically takes 1–3 business days.
          </p>
          <div className="mt-8 flex flex-col gap-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-full bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition"
            >
              Go to Sign In
            </button>
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition">
              ← Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Role selector ─────────────────────────────────────────────────────────
  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
        {/* Logo */}
        <Link to="/" className="mb-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <span className="block font-bold text-slate-900 text-lg">N_COLE</span>
            <span className="block text-[9px] font-semibold uppercase tracking-widest text-orange-500">Interpress</span>
          </div>
        </Link>

        <div className="w-full max-w-xl text-center">
          <h1 className="text-3xl font-bold text-slate-900">Join N_COLE Interpress</h1>
          <p className="mt-3 text-slate-500 max-w-sm mx-auto">
            Choose how you'd like to join our platform. Your application will be reviewed by our team.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Vendor card */}
            <button
              onClick={() => setRole('VENDOR')}
              className="group relative flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm transition hover:border-orange-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400/30"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
                <Store className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Sell on N_COLE</p>
                <p className="mt-1 text-sm text-slate-500">
                  List your products, manage orders, and grow your business on Rwanda's premier marketplace.
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-orange-600 group-hover:gap-2 transition-all">
                Apply as Vendor <ArrowRight className="h-4 w-4" />
              </span>
            </button>

            {/* Rider card */}
            <button
              onClick={() => setRole('RIDER')}
              className="group relative flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm transition hover:border-teal-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400/30"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 transition group-hover:bg-teal-500 group-hover:text-white">
                <Bike className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Deliver for N_COLE</p>
                <p className="mt-1 text-sm text-slate-500">
                  Earn income delivering orders across Rwanda. Flexible hours, verified riders earn more.
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-teal-600 group-hover:gap-2 transition-all">
                Apply as Rider <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">Sign in</Link>
          </p>
          <Link to="/" className="mt-2 inline-block text-xs text-slate-400 hover:text-slate-600">
            ← Back to store
          </Link>
        </div>
      </div>
    );
  }

  // ── Application form ──────────────────────────────────────────────────────
  const isVendor = role === 'VENDOR';
  const accentBg  = isVendor ? 'from-orange-600 to-orange-500' : 'from-teal-600 to-teal-500';
  const accentBtn = isVendor
    ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
    : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top hero bar */}
      <div className={`bg-gradient-to-r ${accentBg} py-8 px-4 text-center text-white`}>
        <Link to="/" className="mx-auto mb-4 flex w-fit items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <ShoppingBag className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-bold tracking-wide">N_COLE Interpress</span>
        </Link>
        <div className="flex items-center justify-center gap-3 mb-2">
          {isVendor
            ? <Store className="h-7 w-7" />
            : <Bike className="h-7 w-7" />}
          <h1 className="text-2xl font-bold">
            {isVendor ? 'Vendor Application' : 'Rider Application'}
          </h1>
        </div>
        <p className="text-sm text-white/80 max-w-md mx-auto">
          {isVendor
            ? 'Complete all fields to apply as a verified vendor on N_COLE Interpress.'
            : 'Complete all fields to apply as a delivery rider on N_COLE Interpress.'}
        </p>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Profile Photo ───────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <Section title="Profile Photo">
              <p className="text-xs text-slate-500 -mt-2">
                Upload a clear, recent photo of yourself. This helps our team verify your identity.
              </p>
              <PhotoUpload
                photoUrl={form.photoUrl}
                uploading={uploading}
                onChange={handlePhotoChange}
                onClear={() => setForm(f => ({ ...f, photoUrl: '' }))}
              />
            </Section>
          </div>

          {/* ── Personal Information ────────────────────────────────────── */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
            <Section title="Personal Information">
              <Grid2>
                <Field label="Full Name" required>
                  <input required className={inp} value={form.fullName} onChange={set('fullName')} placeholder="As on your national ID" />
                </Field>
                <Field label="Email Address" required>
                  <input required type="email" className={inp} value={form.email} onChange={set('email')} placeholder="you@example.com" />
                </Field>
                <Field label="Phone Number" required>
                  <input required className={inp} value={form.phone} onChange={set('phone')} placeholder="+250 7XX XXX XXX" />
                </Field>
                <Field label="National ID Number" required>
                  <input required className={inp} value={form.nationalId} onChange={set('nationalId')} placeholder="1 XXXX X XXXXXXX X XX" />
                </Field>
                <Field label="Date of Birth" required>
                  <input required type="date" className={inp} value={form.dateOfBirth} onChange={set('dateOfBirth')} max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
                </Field>
                <Field label="Province" required>
                  <select required className={sel} value={form.province} onChange={set('province')}>
                    <option value="">Select province…</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </Grid2>
              <Field label="District" required>
                <input required className={inp} value={form.district} onChange={set('district')} placeholder="e.g. Gasabo" />
              </Field>
              <Field label="Home Address" required>
                <input required className={inp} value={form.address} onChange={set('address')} placeholder="Street / neighbourhood / cell" />
              </Field>
            </Section>
          </div>

          {/* ── Role-specific fields ────────────────────────────────────── */}
          {isVendor ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
              <Section title="Business Information">
                <Grid2>
                  <Field label="Business Name" required>
                    <input required className={inp} value={form.businessName} onChange={set('businessName')} placeholder="Your shop/brand name" />
                  </Field>
                  <Field label="Business Type" required>
                    <select required className={sel} value={form.businessType} onChange={set('businessType')}>
                      <option value="">Select type…</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="MTN MoMo Number" required>
                    <input required className={inp} value={form.momoNumber} onChange={set('momoNumber')} placeholder="+250 78X XXX XXX" />
                  </Field>
                  <Field label="Years in Business" required>
                    <input required type="number" min={0} max={100} className={inp} value={form.yearsInBusiness} onChange={set('yearsInBusiness')} placeholder="0" />
                  </Field>
                </Grid2>
                <Field label="Business Address" required>
                  <input required className={inp} value={form.businessAddress} onChange={set('businessAddress')} placeholder="Full business location" />
                </Field>
                <Field label="Business Description">
                  <textarea
                    rows={3}
                    className={`${inp} resize-none`}
                    value={form.description}
                    onChange={set('description')}
                    placeholder="Briefly describe your business, products, and target customers…"
                    maxLength={1000}
                  />
                  <p className="text-right text-[10px] text-slate-400">{form.description.length}/1000</p>
                </Field>
              </Section>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
              <Section title="Delivery Information">
                <Grid2>
                  <Field label="Vehicle Type" required>
                    <select required className={sel} value={form.vehicleType} onChange={set('vehicleType')}>
                      <option value="">Select vehicle…</option>
                      {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Plate Number" required>
                    <input required className={`${inp} font-mono`} value={form.plateNumber} onChange={set('plateNumber')} placeholder="e.g. RAD 123 A" />
                  </Field>
                  <Field label="Driving License Number" required>
                    <input required className={inp} value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="License number" />
                  </Field>
                  <Field label="Primary Delivery Zone" required>
                    <input required className={inp} value={form.deliveryZone} onChange={set('deliveryZone')} placeholder="e.g. Kigali City Centre" />
                  </Field>
                </Grid2>
                <Field label="Delivery Experience">
                  <textarea
                    rows={3}
                    className={`${inp} resize-none`}
                    value={form.experience}
                    onChange={set('experience')}
                    placeholder="Describe any previous delivery or driving experience…"
                    maxLength={500}
                  />
                </Field>
              </Section>
            </div>
          )}

          {/* ── Emergency Contact ───────────────────────────────────────── */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <Section title="Emergency Contact">
              <p className="text-xs text-slate-500 -mt-2">Provide a contact who can be reached in an emergency.</p>
              <Grid2>
                <Field label="Full Name" required>
                  <input required className={inp} value={form.emergencyName} onChange={set('emergencyName')} placeholder="Emergency contact name" />
                </Field>
                <Field label="Phone Number" required>
                  <input required className={inp} value={form.emergencyPhone} onChange={set('emergencyPhone')} placeholder="+250 7XX XXX XXX" />
                </Field>
              </Grid2>
            </Section>
          </div>

          {/* ── Terms notice ────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-500 mt-0.5" />
              <p>
                By submitting this application you confirm that all information provided is accurate and truthful.
                False information will result in immediate rejection. You will receive an email once your application
                has been reviewed (1–3 business days).
              </p>
            </div>
          </div>

          {/* ── Error ───────────────────────────────────────────────────── */}
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => { setRole(null); setForm(INITIAL); setError(''); }}
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              ← Change role
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className={`flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-60 ${accentBtn}`}
            >
              {loading
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Submitting…</>
                : <><User className="h-4 w-4" /> Submit Application <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>

          {/* Back to login */}
          <p className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ApplyPage;
