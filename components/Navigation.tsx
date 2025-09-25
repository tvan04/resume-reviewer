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
          <Button
            variant="default"
            onClick={() => onNavigate(user.type === 'student' ? 'studentDashboard' : 'reviewerDashboard')}
            className="text-xl font-semibold"
          >
            Vanderbilt Resume Reviewer
          </Button>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="flex items-center gap-8">
          <Button
            variant="default"
            onClick={() => onNavigate('studentDashboard')}
            className="font-medium text-lg"
          >
            About
          </Button>

          {user.type === 'student' ? (
            <Button
              variant="default"
              onClick={() => onNavigate('reviewerDashboard')}
              className="font-medium text-lg"
            >
              Sign in as Reviewer
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => onNavigate('studentDashboard')}
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
            onClick={() => onNavigate('account')}
            className="px-6 py-3 rounded-lg"
          >
            Account
          </Button>
        </div>
      </div>
    </nav>
  );
}