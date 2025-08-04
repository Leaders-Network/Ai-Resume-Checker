// 'use client';

// import React, { useEffect, useState } from 'react';
// import { auth, provider } from '@/config/firebase';
// import { signInWithPopup } from 'firebase/auth';
// import { FaGoogle } from 'react-icons/fa';
// import Link from 'next/link';

// const HomePage = () => {
//   const [value, setValue] = useState(null);
//   const [isSigningIn, setIsSigningIn] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleGoogle = async () => {
//     if (isSigningIn) return; // Prevent multiple sign-in attempts
//     setIsSigningIn(true);
//     setError(null); // Clear previous errors

//     try {
//       const data = await signInWithPopup(auth, provider);
//       if (data.user.email) {
//         setValue(data.user.email);
//         localStorage.setItem(
//           'user',
//           JSON.stringify({
//             email: data.user.email,
//             name: data.user.displayName || data.user.email.split('@')[0],
//           })
//         );
//         window.location.href='/dashboard';
//       }
//     } catch (error: any) {
//       setError('An error occurred during sign-in. Please try again.');
//       console.error('Error signing in:', error);
//     } finally {
//       setIsSigningIn(false);
//     }
//   };

//   useEffect(() => {
//     const user = localStorage.getItem('user');
//     if (user) {
//       setValue(JSON.parse(user));
//     }
//   }, []);

//   return (
//     // <div className="w-full h-screen flex items-center justify-center bg-gray-50">
//            <div className="w-full max-w-[100%]  h-[100vh] flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
//         {/* Left Section */}
//         <div className="md:w-1/2 bg-[#130F4D] p-8 flex flex-col justify-center text-white">
//           <h1 className="text-4xl font-bold mb-4">Let’s Get You Started</h1>
//           <p className="mb-8">
//             Quickly upload your resume to uncover insights and get detailed feedback. Let’s help you make it stand out!
//           </p>
//         </div>

//         {/* Right Section */}
//         <div className="md:w-1/2 p-8 flex flex-col pt-44">
//           {/* Form Section */}
//           <div>
//             <form className="space-y-6">
//               <Link href="/signup">
//                 <button className="w-full px-4 py-2 text-white bg-[#130F4D] rounded-lg hover:bg-[#0F0B3E] transition">
//                   Log in with Email
//                 </button>
//               </Link>

//               <p className="text-gray-500 text-center">Or log in with</p>

//               <button
//                 onClick={handleGoogle}
//                 disabled={isSigningIn}
//                 className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition ${
//                   isSigningIn
//                     ? 'bg-gray-400 cursor-not-allowed'
//                     : 'bg-red-600 text-white hover:bg-red-700'
//                 }`}
//               >
//                 {isSigningIn ? (
//                   <div className="flex items-center">
//                     <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
//                     Signing in...
//                   </div>
//                 ) : (
//                   <>
//                     <FaGoogle className="mr-2" /> Google
//                   </>
//                 )}
//               </button>
//             </form>
//             {error && <p className="mt-4 text-center text-red-500">{error}</p>}
//           </div>

//           {/* Buttons Section */}
//           <div className="mt-8 space-y-4">
//             <Link href="/signup">
//               <button className="w-full mt-10 bg-white text-[#130F4D] px-6 py-2 rounded-lg font-semibold hover:bg-gray-200">
//                 Don’t have an account?
//               </button>
//             </Link>
//             <Link href="/">
//               <button className="w-full bg-transparent border border-[#130F4D] px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 text-[#130F4D]">
//                 Back to Homepage
//               </button>
//             </Link>
//           </div>
//         </div>
//       </div>
//     // </div>
//   );
// };

// export default HomePage;




import React from 'react'

const HomePage = () => {
  return (
    <div>
      Home Page
    </div>
  )
}

export default HomePage