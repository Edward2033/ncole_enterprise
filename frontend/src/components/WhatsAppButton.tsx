import React, { useEffect, useState } from 'react';
import { API_BASE } from '@/config/api';

const WhatsAppButton: React.FC = () => {
  const [number, setNumber] = useState('+250794890144');

  useEffect(() => {
    fetch(`${API_BASE}/settings/site`)
      .then(r => r.json())
      .then(j => { if (j?.data?.whatsappNumber) setNumber(j.data.whatsappNumber); })
      .catch(() => null);
  }, []);

  // Strip non-digits for the wa.me link
  const clean = number.replace(/\D/g, '');

  return (
    <a
      href={`https://wa.me/${clean}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/40 transition-transform duration-200 hover:scale-110 hover:bg-green-600 active:scale-95"
    >
      {/* WhatsApp SVG icon */}
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C8.268 2 2 8.268 2 16c0 2.49.648 4.83 1.782 6.86L2 30l7.338-1.742A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.55 11.55 0 0 1-5.89-1.61l-.422-.25-4.354 1.034 1.072-4.24-.276-.436A11.56 11.56 0 0 1 4.4 16C4.4 9.59 9.59 4.4 16 4.4S27.6 9.59 27.6 16 22.41 27.6 16 27.6zm6.34-8.66c-.348-.174-2.06-1.016-2.38-1.132-.318-.116-.55-.174-.78.174-.232.348-.896 1.132-1.098 1.364-.202.232-.404.26-.752.086-.348-.174-1.47-.542-2.8-1.726-1.034-.922-1.732-2.06-1.936-2.408-.202-.348-.022-.536.152-.71.156-.154.348-.404.522-.606.174-.202.232-.348.348-.58.116-.232.058-.434-.028-.608-.088-.174-.78-1.882-1.07-2.578-.282-.676-.568-.584-.78-.594l-.664-.012c-.232 0-.608.086-.926.434-.318.348-1.214 1.186-1.214 2.892s1.242 3.354 1.416 3.586c.174.232 2.444 3.732 5.922 5.234.828.358 1.474.572 1.978.732.832.264 1.588.226 2.186.138.666-.1 2.06-.842 2.35-1.656.29-.814.29-1.512.202-1.656-.086-.144-.318-.232-.666-.406z" />
      </svg>
    </a>
  );
};

export default WhatsAppButton;
