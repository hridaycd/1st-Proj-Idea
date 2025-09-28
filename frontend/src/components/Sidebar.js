import React from 'react';
import { 
  Home, 
  Building2, 
  Utensils, 
  Calendar, 
  BarChart3, 
  Settings, 
  User,
  Plus,
  List
} from 'lucide-react';

const Sidebar = ({ isOpen, onItemClick, currentPath, userType }) => {
  const isOwner = userType === 'hotel_owner' || userType === 'restaurant_owner';

  const customerMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/hotels', label: 'Hotels', icon: Building2 },
    { path: '/restaurants', label: 'Restaurants', icon: Utensils },
    { path: '/bookings', label: 'My Bookings', icon: Calendar },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const ownerMenuItems = [
    { path: '/owner/dashboard', label: 'Dashboard', icon: Home },
    { path: '/owner/bookings', label: 'Bookings', icon: List },
    { path: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const menuItems = isOwner ? ownerMenuItems : customerMenuItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => onItemClick('/')}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-16 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
      `}>
        <div className="p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => onItemClick(item.path)}
                  className={`
                    w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick actions for owners */}
          {isOwner && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {userType === 'hotel_owner' && (
                  <button
                    onClick={() => onItemClick('/hotels/new')}
                    className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                  >
                    <Plus size={20} className="mr-3" />
                    <span className="font-medium">Add Hotel</span>
                  </button>
                )}
                {userType === 'restaurant_owner' && (
                  <button
                    onClick={() => onItemClick('/restaurants/new')}
                    className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                  >
                    <Plus size={20} className="mr-3" />
                    <span className="font-medium">Add Restaurant</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
