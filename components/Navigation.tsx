// ...existing code...
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
          <Button
            variant="default"
            onClick={() => go(user?.type === 'student' ? 'studentDashboard' : 'reviewerDashboard')}
            className="text-xl font-semibold"
          >
            Vanderbilt Resume Reviewer
          </Button>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="flex items-center gap-8">
          <Button
            variant="default"
            onClick={() => go('studentDashboard')}
            className="font-medium text-lg"
          >
            About
          </Button>

          {user?.type === 'student' ? (
            <Button
              variant="default"
              onClick={() => go('reviewerDashboard')}
              className="font-medium text-lg"
            >
              Sign in as Reviewer
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => go('studentDashboard')}
              className="font-medium text-lg"
            >
              Sign in as Student
            </Button>
          )}

          <Button
            variant="default"
            onClick={onLogout}
            className="font-medium text-lg"
          >
            Log Out
          </Button>

          <Button
            variant="default"
            onClick={() => go('account')}
            className="px-6 py-3 rounded-lg"
          >
            Account
          </Button>
        </div>
      </div>
    </nav>
  );
}
// ...existing code...