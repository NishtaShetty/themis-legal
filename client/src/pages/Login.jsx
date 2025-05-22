import React, { useState } from 'react';

export default function Login() {
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);

  const handleSendOtp = () => {
    setStep(2);
  };

  const handleVerifyOtp = () => {
    // verify OTP logic
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 text-white">
      <div className="p-8 rounded-xl shadow-xl bg-gray-800 w-96">
        <h1 className="text-2xl mb-4 font-bold text-center">Secure Aadhaar Login</h1>
        {step === 1 ? (
          <>
            <input className="w-full mb-4 p-2 rounded bg-gray-700" placeholder="Enter Aadhaar Number" value={aadhaar} onChange={e => setAadhaar(e.target.value)} />
            <button onClick={handleSendOtp} className="bg-blue-600 w-full p-2 rounded hover:bg-blue-700">Send OTP</button>
          </>
        ) : (
          <>
            <input className="w-full mb-4 p-2 rounded bg-gray-700" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} />
            <button onClick={handleVerifyOtp} className="bg-green-600 w-full p-2 rounded hover:bg-green-700">Verify OTP</button>
          </>
        )}
      </div>
    </div>
  );
}