'use client'

import Link from 'next/link';

import { FileText, User } from "lucide-react";
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserName(parsedUser.name || parsedUser.email);
    }
  }, []);

  return (
    <nav className="flex items-center justify-between p-6  shadow-md z-50">
      <div className="flex items-center space-x-2">
        <FileText className="h-8 w-8 text-blue-600" />
        <span className="text-xl font-bold">ResumeAI</span>
      </div>
      <div className="flex space-x-6">
        <Button variant="ghost">Features</Button>
        {userName ? (
          <div className="flex items-center space-x-2">
            {/* <User className="h-5 w-5" /> */}
            <span className=" font-bold"><span className='font-medium'>Welcome,</span> {userName}</span>
          </div>
        ) : (
          <Link href="/signin">
            <Button variant="default">Sign In</Button>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;