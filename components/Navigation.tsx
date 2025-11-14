import { Button } from './ui/button';
import { User } from '../src/App';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  user: User;
  onLogout: () => void;
}

export function NavigationBar({ user, onLogout }: NavigationProps) {
  const navigate = useNavigate();

  const go = (screen: string) => {
    switch (screen) {
      case 'login':
        navigate('/login');
        break;
      case 'studentDashboard':
        navigate('/student');
        break;
      case 'reviewerDashboard':
        navigate('/reviewer');
        break;
      case 'account':
        navigate('/account');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <nav className="bg-white h-[164px] w-full">
      <div className="container mx-auto flex items-center justify-between h-full px-8">
        {/* Left Section: Logo */}
        <div>
          <button
            onClick={() => go(user.type === 'student' ? 'studentDashboard' : 'reviewerDashboard')}
            className="text-xl font-semibold text-black hover:text-gray-600 transition-colors"
          >
            Vanderbilt Resume Reviewer
          </button>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="flex items-center gap-8">
          <Button
            variant="default"
            onClick={() => go('studentDashboard')}
            className="font-medium text-lg text-black bg-white hover:bg-gray-200 transition-colors"
          >
            About
          </Button>

          {user?.type === 'student' ? (
            <Button
              variant="default"
              onClick={() => go('reviewerDashboard')}
              className="font-medium text-lg text-black bg-white hover:bg-gray-200 transition-colors"
            >
              Sign in as Reviewer
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => go('studentDashboard')}
              className="font-medium text-lg text-black bg-white hover:bg-gray-200 transition-colors"
            >
              Sign in as Student
            </Button>
          )}

          <button
            onClick={onLogout}
            className="font-medium text-lg text-black hover:text-gray-600 transition-colors"
          >
            Log Out
          </button>

          <Button
            variant="default"
            onClick={() => go('account')}
            className="bg-[#e6e6e6] font-medium text-lg text-black hover:bg-white transition-colors"
          >
            Account
          </Button>
        </div>
      </div>
    </nav>
  );
}