import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { Menu, UserCircle } from "lucide-react";
import { toggleSidebar } from "@/app/redux/slices/chatSlice";

const ChatHeader: React.FC = () => {
  const { selectedUser } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch();

  return (
    <>
      {/* Mobile menu button */}
      <div className="sm:hidden fixed top-4 right-4 z-30">
        <button
          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          onClick={() => dispatch(toggleSidebar())}
        >
          <Menu className="w-5 h-5 text-gray-200" />
        </button>
      </div>

      <div className="mb-6 bg-gray-800 rounded-lg border-gray-700 p-6">
        <div className="flex items-center gap-4">
          {selectedUser ? (
            <>
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-gray-300" />
              </div>
              <h2 className="text-2xl font-bold text-white truncate">
                {selectedUser.name}
              </h2>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-400">
                  Select a conversation
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHeader;
