import React from "react";
import { useSelector } from "react-redux";
import { useFetchChat } from "../hooks/useChat";
import { RootState } from "../redux/store";
import { Menu, UserCircle } from "lucide-react";
import { setTyping, toggleSidebar } from "@/app/redux/slices/chatSlice";
import { useDispatch } from "react-redux";

const ChatHeader = () => {
  const { selectedUser } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch();
  return (
    <>
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
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-gray-300" />
                </div>
                {/* online user setup */}
              </div>

              {/* user info */}
              <div className="flex min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white truncate">
                    {selectedUser.name}
                  </h2>
                </div>
              </div>

              {/* to show typing status */}
            </>
          ) : (
            <div className="flex items-center gap-4">
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
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHeader;
