import { Button } from './ui/button';
import { User, Screen } from '../src/App';

interface NavigationProps {
  user: User;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export function Navigation({ user, onNavigate, onLogout }: NavigationProps) {
  return (
    <nav className="bg-white h-[164px] w-full">
      <div className="container mx-auto flex items-center justify-between h-full px-8">
        {/* Left Section: Logo */}
        <div>
          <button
            onClick={() => onNavigate(user.type === 'student' ? 'studentDashboard' : 'reviewerDashboard')}
            className="text-xl font-semibold text-black hover:text-gray-600 transition-colors"
          >
            Vanderbilt Resume Reviewer
          </button>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('studentDashboard')}
            className="font-medium text-lg text-black hover:text-gray-600 transition-colors"
          >
            About
          </button>

          {user.type === 'student' ? (
            <button
              onClick={() => onNavigate('reviewerDashboard')}
              className="font-medium text-lg text-black hover:text-gray-600 transition-colors"
            >
              Sign in as Reviewer
            </button>
          ) : (
            <button
              onClick={() => onNavigate('studentDashboard')}
              className="font-medium text-lg text-black hover:text-gray-600 transition-colors"
            >
              Sign in as Student
            </button>
          )}

          <button
            onClick={onLogout}
            className="font-medium text-lg text-black hover:text-gray-600 transition-colors"
          >
            Log Out
          </button>

          <Button
            onClick={() => onNavigate('account')}
            className="bg-[#e6e6e6] text-black px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Account
          </Button>
        </div>
      </div>
    </nav>
  );
}